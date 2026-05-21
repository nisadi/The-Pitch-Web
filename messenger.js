// sms.js - V2 Implementation
import dotenv from 'dotenv';
import axios from 'axios';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocalPath = resolve(__dirname, '.env.local');
const envPath = resolve(__dirname, '.env');

if (existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

// Dialog eSMS API configuration
const ESMS_API_BASE_URL = 'https://e-sms.dialog.lk';
const ESMS_USERNAME = process.env.ESMS_USERNAME;
const ESMS_PASSWORD = process.env.ESMS_PASSWORD;
const ESMS_DEFAULT_MASK = process.env.ESMS_DEFAULT_MASK || '';
const ESMS_GET_KEY = process.env.ESMS_GET_KEY;

// Configuration
const CONFIG = {
    USE_POST_METHOD: true, // Set to false to use GET method
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 1000, // ms
    SMS_MAX_LENGTH: 160,
    TOKEN_REFRESH_THRESHOLD: 300, // Refresh token 5 minutes before expiry (seconds)
    PHONE_NUMBER_FORMATS: {
        '9DIGIT': /^7\d{8}$/, // 712345678
        '10DIGIT': /^0[7-8]\d{8}$/, // 0712345678
        '11DIGIT': /^94[7-8]\d{8}$/ // 94712345678
    }
};

// In-memory cache for tokens
let tokenCache = {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    refreshExpiresAt: null
};

// Error handling utility
class SMSError extends Error {
    constructor(message, code, originalError = null) {
        super(message);
        this.name = 'SMSError';
        this.code = code;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
}

// Retry utility
const retry = async (fn, attempts = CONFIG.RETRY_ATTEMPTS, delay = CONFIG.RETRY_DELAY) => {
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === attempts - 1) throw error;
            
            console.warn(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1))); // Exponential backoff
        }
    }
};

/**
 * Format phone number to Dialog's 9-digit format
 * @param {string} phone - Phone number in various formats
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phone) => {
    if (!phone || typeof phone !== 'string') {
        throw new SMSError('Invalid phone number', 'INVALID_PHONE');
    }

    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Convert to 9-digit format
    if (CONFIG.PHONE_NUMBER_FORMATS['11DIGIT'].test(digits)) {
        // 94712345678 -> 712345678
        return digits.substring(2);
    } else if (CONFIG.PHONE_NUMBER_FORMATS['10DIGIT'].test(digits)) {
        // 0712345678 -> 712345678
        return digits.substring(1);
    } else if (CONFIG.PHONE_NUMBER_FORMATS['9DIGIT'].test(digits)) {
        // Already in correct format
        return digits;
    } else {
        throw new SMSError(`Invalid phone number format: ${phone}`, 'INVALID_FORMAT');
    }
};

/**
 * Validate and truncate message if necessary
 * @param {string} message - SMS message
 * @returns {string} Validated message
 */
const validateMessage = (message, options = {}) => {
    if (!message || typeof message !== 'string') {
        throw new SMSError('Message cannot be empty', 'EMPTY_MESSAGE');
    }

    if (options.skipMaxLength) {
        return message;
    }
    
    if (message.length > CONFIG.SMS_MAX_LENGTH) {
        console.warn(`Message truncated from ${message.length} to ${CONFIG.SMS_MAX_LENGTH} characters`);
        return message.substring(0, CONFIG.SMS_MAX_LENGTH - 3) + '...';
    }
    
    return message;
};

/**
 * Get or refresh access token for Dialog eSMS API
 */
const getAccessToken = async (forceRefresh = false) => {
    // Return cached token if still valid and not forcing refresh
    if (!forceRefresh && 
        tokenCache.accessToken && 
        tokenCache.expiresAt && 
        Date.now() < (tokenCache.expiresAt * 1000 - CONFIG.TOKEN_REFRESH_THRESHOLD * 1000)) {
        return tokenCache.accessToken;
    }

    try {
        const response = await axios.post(
            `${ESMS_API_BASE_URL}/api/v1/login`,
            {
                username: ESMS_USERNAME,
                password: ESMS_PASSWORD
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            }
        );

        if (response.data.status === 'success') {
            // Update cache
            tokenCache = {
                accessToken: response.data.token,
                refreshToken: response.data.refreshToken,
                expiresAt: response.data.expiration,
                refreshExpiresAt: response.data.refreshExpiration,
                userData: response.data.userData
            };
            
            console.log('Dialog eSMS: New access token obtained');
            return tokenCache.accessToken;
        } else {
            // Check for account lock or other issues
            if (response.data.remainingCount !== null) {
                throw new SMSError(
                    `Login failed. Remaining attempts: ${response.data.remainingCount}. ${response.data.comment}`,
                    'LOGIN_FAILED',
                    response.data
                );
            }
            throw new SMSError(`Login failed: ${response.data.comment}`, 'LOGIN_FAILED', response.data);
        }
    } catch (err) {
        if (err instanceof SMSError) throw err;
        
        const errorData = err.response?.data || err.message;
        console.error('Dialog eSMS token error:', errorData);
        
        // Handle specific error codes
        if (err.response?.data?.errCode === 116) {
            throw new SMSError('Account is locked. Please contact support.', 'ACCOUNT_LOCKED', errorData);
        } else if (err.response?.data?.errCode === 115) {
            throw new SMSError('Invalid username or password', 'INVALID_CREDENTIALS', errorData);
        } else if (err.code === 'ECONNABORTED') {
            throw new SMSError('Connection timeout while getting token', 'TIMEOUT', errorData);
        } else {
            throw new SMSError('Failed to get access token', 'TOKEN_ERROR', errorData);
        }
    }
};

/**
 * Send SMS using Dialog eSMS API v2 (POST method)
 * @param {string} phone - Phone number
 * @param {string} message - SMS message content
 * @param {string} sourceAddress - Source mask/address
 * @param {object} options - Additional options
 * @returns {Promise<object>} API response
 */
const sendSMSPost = async (phone, message, sourceAddress = ESMS_DEFAULT_MASK, options = {}) => {
    const formattedPhone = formatPhoneNumber(phone);
    const validatedMessage = validateMessage(message, options);
    
    const token = await retry(() => getAccessToken());
    
    // Generate unique transaction ID
    const transactionId = options.transactionId || 
                         `${Date.now()}${Math.floor(Math.random() * 10000)}`.slice(-19);
    
    const requestData = {
        msisdn: [{ mobile: formattedPhone }],
        message: validatedMessage,
        transaction_id: parseInt(transactionId),
        payment_method: options.paymentMethod || 0 // 0 = wallet, 4 = package
    };
    
    // Add optional fields
    if (sourceAddress && sourceAddress.trim()) {
        requestData.sourceAddress = sourceAddress.trim().substring(0, 11); // Max 11 chars
    }
    
    if (options.pushNotificationUrl) {
        requestData.push_notification_url = options.pushNotificationUrl;
    }
    
    try {
        const response = await axios.post(
            `${ESMS_API_BASE_URL}/api/v2/sms`,
            requestData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000 // 15 second timeout
            }
        );

        if (response.data.status === 'success') {
            console.log('SMS sent successfully via POST:', {
                campaignId: response.data.data?.campaignId,
                cost: response.data.data?.campaignCost,
                balance: response.data.data?.walletBalance,
                transactionId: transactionId
            });
            
            return {
                success: true,
                data: response.data.data,
                messageId: response.data.data?.campaignId,
                transactionId: transactionId,
                timestamp: new Date().toISOString()
            };
        } else {
            // Handle specific error codes
            const errorCode = response.data.errCode;
            let errorMessage = response.data.comment || 'Unknown error';
            
            switch (errorCode) {
                case 109:
                    errorMessage = 'No valid mobile numbers after validation';
                    break;
                case 108:
                    errorMessage = 'Invalid or inactive source mask';
                    break;
                case 114:
                    errorMessage = 'Insufficient wallet balance';
                    break;
                case 104:
                    errorMessage = 'Transaction ID already used';
                    break;
            }
            
            throw new SMSError(`SMS sending failed: ${errorMessage}`, errorCode, response.data);
        }
    } catch (err) {
        if (err instanceof SMSError) throw err;
        
        // Check for token expiration
        if (err.response?.data?.errCode === 100 || 
            err.response?.data?.comment?.includes('Token Expired')) {
            console.warn('Token expired, forcing refresh...');
            await getAccessToken(true); // Force refresh
            // Retry once with new token
            return sendSMSPost(phone, message, sourceAddress, options);
        }
        
        const errorData = err.response?.data || err.message;
        console.error('SMS POST API error:', errorData);
        
        if (err.code === 'ECONNABORTED') {
            throw new SMSError('SMS sending timeout', 'SEND_TIMEOUT', errorData);
        } else if (err.response?.status === 401) {
            throw new SMSError('Authentication failed', 'AUTH_FAILED', errorData);
        } else {
            throw new SMSError('Failed to send SMS', 'SEND_FAILED', errorData);
        }
    }
};

/**
 * Send SMS via GET request
 * @param {string} phone - Phone number
 * @param {string} message - SMS message content
 * @param {string} sourceAddress - Source mask/address
 * @param {object} options - Additional options
 * @returns {Promise<object>} API response
 */
const sendSMSGet = async (phone, message, sourceAddress = ESMS_DEFAULT_MASK, options = {}) => {
    if (!ESMS_GET_KEY) {
        throw new SMSError('ESMS_GET_KEY is not configured in .env', 'MISSING_CONFIG');
    }

    const formattedPhone = formatPhoneNumber(phone);
    const validatedMessage = validateMessage(message, options);
    
    const params = {
        esmsqk: ESMS_GET_KEY,
        list: formattedPhone,
        message: validatedMessage,
        paymentType: options.paymentMethod || 0
    };
    
    // Add optional fields
    if (sourceAddress && sourceAddress.trim()) {
        params.source_address = sourceAddress.trim().substring(0, 11);
    }
    
    if (options.pushNotificationUrl) {
        params.push_notification_url = options.pushNotificationUrl;
    }
    
    try {
        const response = await axios.get(
            `${ESMS_API_BASE_URL}/api/v1/message-via-url/create/url-campaign`,
            {
                params: params,
                timeout: 15000,
                paramsSerializer: {
                    indexes: null // Don't serialize arrays with indexes
                }
            }
        );

        // GET API returns just a status code
        const statusCode = response.data;
        
        // Error code mapping
        const errorMap = {
            2001: { message: 'Error during campaign creation', code: 'CAMPAIGN_ERROR' },
            2002: { message: 'Bad request', code: 'BAD_REQUEST' },
            2003: { message: 'Empty number list', code: 'EMPTY_LIST' },
            2004: { message: 'Empty message body', code: 'EMPTY_MESSAGE' },
            2005: { message: 'Invalid number list format', code: 'INVALID_LIST' },
            2006: { message: 'Not eligible for GET requests', code: 'NOT_ELIGIBLE' },
            2007: { message: 'Invalid API key', code: 'INVALID_KEY' },
            2008: { message: 'Insufficient balance', code: 'INSUFFICIENT_BALANCE' },
            2009: { message: 'No valid numbers found', code: 'NO_VALID_NUMBERS' },
            2010: { message: 'Not eligible for package', code: 'PACKAGE_ERROR' },
            2011: { message: 'Transactional error', code: 'TRANSACTION_ERROR' }
        };

        if (statusCode === 1) {
            console.log('SMS sent successfully via GET');
            return {
                success: true,
                statusCode: statusCode,
                timestamp: new Date().toISOString()
            };
        } else if (errorMap[statusCode]) {
            throw new SMSError(errorMap[statusCode].message, errorMap[statusCode].code, statusCode);
        } else {
            throw new SMSError(`Unknown error code: ${statusCode}`, 'UNKNOWN_ERROR', statusCode);
        }
    } catch (err) {
        if (err instanceof SMSError) throw err;
        
        console.error('SMS GET API error:', err.message);
        
        if (err.code === 'ECONNABORTED') {
            throw new SMSError('SMS sending timeout', 'SEND_TIMEOUT', err.message);
        } else if (err.response?.status === 404) {
            throw new SMSError('API endpoint not found', 'ENDPOINT_NOT_FOUND', err.message);
        } else {
            throw new SMSError('Failed to send SMS via GET', 'SEND_FAILED', err.message);
        }
    }
};

/**
 * Main SMS sending function
 * @param {string} phone - Phone number
 * @param {string} message - SMS message
 * @param {object} options - Additional options
 * @returns {Promise<object>} Result
 */
const sendSMS = async (phone, message, options = {}) => {
    const sendOptions = {
        sourceAddress: options.sourceAddress || ESMS_DEFAULT_MASK,
        paymentMethod: options.paymentMethod || 0,
        pushNotificationUrl: options.pushNotificationUrl,
        transactionId: options.transactionId,
        useGetMethod: options.useGetMethod !== undefined ? options.useGetMethod : !CONFIG.USE_POST_METHOD,
        skipMaxLength: options.skipMaxLength === true,
    };
    
    try {
        if (sendOptions.useGetMethod) {
            return await retry(() => sendSMSGet(phone, message, sendOptions.sourceAddress, sendOptions));
        } else {
            return await retry(() => sendSMSPost(phone, message, sendOptions.sourceAddress, sendOptions));
        }
    } catch (error) {
        // Log detailed error information
        console.error('SMS sending failed:', {
            phone: phone,
            error: error.message,
            code: error.code,
            timestamp: error.timestamp
        });

        return {
            success: false,
            error: error.message,
            code: error.code || 'SEND_FAILED',
            phone,
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Check account balance
 * @param {boolean} useGetMethod - Use GET method for balance check
 * @returns {Promise<number>} Account balance
 */
const checkSMSBalance = async (useGetMethod = false) => {
    if (useGetMethod && !ESMS_GET_KEY) {
        throw new SMSError('ESMS_GET_KEY is not configured for GET method', 'MISSING_CONFIG');
    }
    
    if (useGetMethod) {
        // GET method for balance
        try {
            const response = await axios.get(
                `${ESMS_API_BASE_URL}/api/v1/message-via-url/check/balance`,
                {
                    params: { esmsqk: ESMS_GET_KEY },
                    timeout: 10000
                }
            );

            const responseData = response.data;
            if (responseData.startsWith('1|')) {
                const balance = parseFloat(responseData.split('|')[1]);
                console.log(`SMS account balance (GET): ${balance}`);
                return balance;
            } else {
                throw new SMSError(`Balance check failed: ${responseData}`, 'BALANCE_CHECK_FAILED');
            }
        } catch (err) {
            console.error('GET Balance check error:', err.message);
            throw new SMSError('Failed to check balance via GET', 'BALANCE_ERROR', err);
        }
    } else {
        // POST method (requires token)
        try {
            const token = await getAccessToken();
            
            // We can't directly check balance via POST API, but we can get it from login response
            if (tokenCache.userData?.walletBalance !== undefined) {
                return tokenCache.userData.walletBalance;
            } else {
                // Get fresh token to get balance
                await getAccessToken(true);
                return tokenCache.userData?.walletBalance || 0;
            }
        } catch (err) {
            console.error('POST Balance check error:', err.message);
            throw new SMSError('Failed to check balance', 'BALANCE_ERROR', err);
        }
    }
};

/**
 * Check campaign status by transaction ID
 * @param {string} transactionId - Transaction ID
 * @param {boolean} useV2 - Use v2 API endpoint
 * @returns {Promise<object>} Campaign status
 */
const checkCampaignStatus = async (transactionId, useV2 = true) => {
    try {
        const token = await getAccessToken();
        const endpoint = useV2 ? '/api/v2/sms/check-transaction' : '/api/v1/sms/check-transaction';
        
        const response = await axios.post(
            `${ESMS_API_BASE_URL}${endpoint}`,
            { transaction_id: parseInt(transactionId) },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        if (response.data.status === 'success') {
            return {
                success: true,
                status: response.data.data?.campaign_status,
                transactionId: response.data.transaction_id,
                timestamp: new Date().toISOString()
            };
        } else {
            throw new SMSError(`Status check failed: ${response.data.comment}`, 'STATUS_CHECK_FAILED', response.data);
        }
    } catch (err) {
        console.error('Campaign status check error:', err.message);
        throw new SMSError('Failed to check campaign status', 'STATUS_ERROR', err);
    }
};

const clearTokenCache = () => {
    tokenCache = {
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        refreshExpiresAt: null
    };
    console.log('SMS token cache cleared');
};

// Template message generators
const MessageTemplates = {
    APPOINTMENT_CONFIRMATION: (date, time) => 
        `Appointment Confirmed! Date: ${date}, Time: ${time}. Thank you for choosing us.`,

    APPOINTMENT_NOTICE: (date, time) =>
        `Appointment Notice: You have an appointment on ${date} at ${time}. Please arrive early.`,

    APPOINTMENT_CANCELLATION: (date, time, provider, reason = '') =>
        `Appointment Cancelled: Your appointment with ${provider} on ${date} at ${time} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,

    APPOINTMENT_RESCHEDULE: (pastDate, pastTime, doctorName, newDate, newTime) =>
        `Appointment Rescheduled: Your appointment with ${doctorName} has been changed from ${pastDate} ${pastTime} to ${newDate} ${newTime}.`,

    REMINDER: (date, time, dentistName) =>
        `Reminder: Appointment with Dr. ${dentistName} on ${date} at ${time}. Reply 'CANCEL' to reschedule.`,

    ACCOUNT_CREATION: (ID) =>
        `Account Created! Your Patient ID: ${ID}. Keep this for future reference.`,

    MEDICAL_IMAGE_ADDED: (date, patientName) =>
        `Medical Update: New images for ${patientName} added on ${date}. Check patient portal.`,

    MEDICAL_REPORT_ADDED: (date, patientName) =>
        `Medical Update: New reports for ${patientName} added on ${date}. Check patient portal.`,

    MEDICAL_IMAGE_AND_REPORT_ADDED: (date, patientName) =>
        `Medical Update: New images & reports for ${patientName} added on ${date}. Check patient portal.`
};

// High-level SMS functions matching WhatsApp API
const sendAppointmentConfirmationSMS = async (phone, date, time, options = {}) => {
    const message = MessageTemplates.APPOINTMENT_CONFIRMATION(date, time);
    return sendSMS(phone, message, options);
};

const sendAppointmentNoticeSMS = async (phone, date, time, options = {}) => {
    const message = MessageTemplates.APPOINTMENT_NOTICE(date, time);
    return sendSMS(phone, message, options);
};

const sendAppointmentCancellationSMS = async (phone, date, time, provider, reason = '', options = {}) => {
    const message = MessageTemplates.APPOINTMENT_CANCELLATION(date, time, provider, reason);
    return sendSMS(phone, message, options);
};

const sendAppointmentRescheduleSMS = async (phone, pastDate, pastTime, doctorName, newDate, newTime, options = {}) => {
    const message = MessageTemplates.APPOINTMENT_RESCHEDULE(pastDate, pastTime, doctorName, newDate, newTime);
    return sendSMS(phone, message, options);
};

const sendReminderSMS = async (phone, date, time, dentistName, options = {}) => {
    const message = MessageTemplates.REMINDER(date, time, dentistName);
    return sendSMS(phone, message, options);
};

const sendAccountCreationNoticeSMS = async (phone, ID, options = {}) => {
    const message = MessageTemplates.ACCOUNT_CREATION(ID);
    return sendSMS(phone, message, options);
};

const sendMedicalImageAddedNoticeSMS = async (phone, date, patientName, options = {}) => {
    const message = MessageTemplates.MEDICAL_IMAGE_ADDED(date, patientName);
    return sendSMS(phone, message, options);
};

const sendMedicalReportAddedNoticeSMS = async (phone, date, patientName, options = {}) => {
    const message = MessageTemplates.MEDICAL_REPORT_ADDED(date, patientName);
    return sendSMS(phone, message, options);
};

const sendMedicalImageAndReportAddedNoticeSMS = async (phone, date, patientName, options = {}) => {
    const message = MessageTemplates.MEDICAL_IMAGE_AND_REPORT_ADDED(date, patientName);
    return sendSMS(phone, message, options);
};

// Alias for compatibility
const sendHelloWorldSMS = async (phone, options = {}) => {
    const message = 'Hello! Welcome to our healthcare service. We are here to help you.';
    return sendSMS(phone, message, options);
};

const sendtempAppointmentSMS = sendAppointmentNoticeSMS;

export {
    // Core functions
    sendSMS,
    sendSMSPost,
    sendSMSGet,
    checkSMSBalance,
    checkCampaignStatus,
    clearTokenCache,
    
    // Message templates
    MessageTemplates,
    
    // Utility functions
    formatPhoneNumber,
    validateMessage,
    
    // Error class
    SMSError,
    
    // Event-based SMS functions
    sendHelloWorldSMS,
    sendAppointmentConfirmationSMS,
    sendAppointmentNoticeSMS,
    sendtempAppointmentSMS,
    sendAppointmentCancellationSMS,
    sendAppointmentRescheduleSMS,
    sendReminderSMS,
    sendAccountCreationNoticeSMS,
    sendMedicalImageAddedNoticeSMS,
    sendMedicalReportAddedNoticeSMS,
    sendMedicalImageAndReportAddedNoticeSMS
};