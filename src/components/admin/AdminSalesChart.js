"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  formatLkr,
  formatPercentChange,
  salesOverviewData as fallbackSalesOverview,
} from "./adminSalesChartData";
import styles from "./AdminSalesChart.module.css";

const CHART = {
  width: 900,
  height: 300,
  padding: { top: 16, right: 16, bottom: 36, left: 56 },
};

const Y_TICKS = [0, 500, 1000, 1500, 2000, 2500];
const PRIMARY_COLOR = "#A3FF00";
const TOOLTIP_GAP = 12;
const TOOLTIP_PAD = 8;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function measureTooltipPosition(scrollEl, tooltipEl, anchorX, anchorY) {
  const svg = scrollEl.querySelector("svg");
  if (!svg) return null;

  const scrollWidth = scrollEl.clientWidth;
  const scrollHeight = scrollEl.clientHeight;
  const svgRect = svg.getBoundingClientRect();
  const scaleX = svgRect.width / CHART.width;
  const scaleY = svgRect.height / CHART.height;

  const pointX = anchorX * scaleX - scrollEl.scrollLeft;
  const pointY = anchorY * scaleY;

  const tipWidth = tooltipEl.offsetWidth || 260;
  const tipHeight = tooltipEl.offsetHeight || 80;

  const left = clamp(
    pointX,
    tipWidth / 2 + TOOLTIP_PAD,
    scrollWidth - tipWidth / 2 - TOOLTIP_PAD
  );

  const flipBelow = anchorY / CHART.height < 0.45;
  let top = flipBelow
    ? pointY + TOOLTIP_GAP
    : pointY - tipHeight - TOOLTIP_GAP;

  top = clamp(top, TOOLTIP_PAD, scrollHeight - tipHeight - TOOLTIP_PAD);

  return { left, top };
}

function buildLinePath(points, maxY) {
  const { width, height, padding } = CHART;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  return points
    .map((point, index) => {
      const x =
        padding.left + (index / Math.max(points.length - 1, 1)) * chartW;
      const y = padding.top + chartH - (point.value / maxY) * chartH;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildDots(points, maxY) {
  const { width, height, padding } = CHART;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  return points.map((point, index) => {
    const x = padding.left + (index / Math.max(points.length - 1, 1)) * chartW;
    const y = padding.top + chartH - (point.value / maxY) * chartH;
    return {
      x,
      y,
      index,
      value: point.value,
      date: point.date,
      tooltipDate: point.tooltipDate ?? point.date,
      key: `${point.date}-${index}`,
    };
  });
}

function ChartTooltip({ series, index, showComparison }) {
  const rows = series.map((item) => {
    const point = item.points[index];
    return {
      label: item.label,
      color: item.color,
      dashed: item.dashed,
      tooltipDate: point.tooltipDate ?? point.date,
      value: point.value,
    };
  });

  const comparison =
    showComparison && rows.length >= 2
      ? formatPercentChange(rows[0].value, rows[1].value)
      : null;

  return (
    <div className={styles.tooltip}>
      {rows.map((row, rowIndex) => (
        <div key={row.label} className={styles.tooltipRow}>
          <span
            className={`${styles.tooltipLine} ${row.dashed ? styles.tooltipLineDashed : ""}`}
            style={{ borderTopColor: row.color }}
          />
          <span className={styles.tooltipDate}>{row.tooltipDate}</span>
          {rowIndex === 0 && comparison ? (
            <span
              className={
                comparison.up ? styles.tooltipChangeUp : styles.tooltipChangeDown
              }
            >
              {comparison.up ? "↑" : "↓"} {comparison.text}
            </span>
          ) : (
            <span className={styles.tooltipSpacer} />
          )}
          <span className={styles.tooltipValue}>{formatLkr(row.value)}</span>
        </div>
      ))}
    </div>
  );
}

function SalesLineChart({
  series,
  maxY = 2500,
  yTicks = Y_TICKS,
  showComparison = false,
  loading = false,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const chartScrollRef = useRef(null);
  const tooltipRef = useRef(null);
  const dates = series[0]?.points.map((p) => p.date) ?? [];

  const anchorDots =
    hoveredIndex !== null
      ? series.map((item) => buildDots(item.points, maxY)[hoveredIndex])
      : null;
  const anchorX = anchorDots?.[0]?.x ?? null;
  const anchorY = anchorDots
    ? Math.min(...anchorDots.map((dot) => dot.y))
    : null;
  useLayoutEffect(() => {
    if (
      hoveredIndex === null ||
      anchorX === null ||
      anchorY === null ||
      !chartScrollRef.current ||
      !tooltipRef.current
    ) {
      setTooltipPos(null);
      return;
    }

    const updatePosition = () => {
      const next = measureTooltipPosition(
        chartScrollRef.current,
        tooltipRef.current,
        anchorX,
        anchorY
      );
      setTooltipPos(next);
    };

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);

    const scrollEl = chartScrollRef.current;
    scrollEl.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);

    return () => {
      cancelAnimationFrame(frame);
      scrollEl.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [hoveredIndex, anchorX, anchorY, series, showComparison]);

  if (loading) {
    return (
      <div className={styles.chartArea}>
        <p className={styles.chartLoading}>Loading sales data…</p>
      </div>
    );
  }

  return (
    <div
      className={styles.chartArea}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <div className={styles.chartScroll} ref={chartScrollRef}>
        {hoveredIndex !== null && anchorX !== null && anchorY !== null && (
          <div
            ref={tooltipRef}
            className={styles.tooltipAnchor}
            style={{
              left: tooltipPos?.left ?? 0,
              top: tooltipPos?.top ?? 0,
              visibility: tooltipPos ? "visible" : "hidden",
            }}
          >
            <ChartTooltip
              series={series}
              index={hoveredIndex}
              showComparison={showComparison}
            />
          </div>
        )}

      <svg
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        className={styles.chart}
        role="img"
        aria-label="Sales chart for the past week"
      >
        {yTicks.map((tick) => {
          const y =
            CHART.padding.top +
            (CHART.height - CHART.padding.top - CHART.padding.bottom) -
            (tick / maxY) *
              (CHART.height - CHART.padding.top - CHART.padding.bottom);
          return (
            <g key={tick}>
              <line
                x1={CHART.padding.left}
                y1={y}
                x2={CHART.width - CHART.padding.right}
                y2={y}
                className={styles.gridLine}
              />
              <text
                x={CHART.padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className={styles.axisLabel}
              >
                {formatLkr(tick, true)}
              </text>
            </g>
          );
        })}

        {dates.map((date, index) => {
          const x =
            CHART.padding.left +
            (index / Math.max(dates.length - 1, 1)) *
              (CHART.width - CHART.padding.left - CHART.padding.right);
          return (
            <text
              key={date}
              x={x}
              y={CHART.height - 10}
              textAnchor="middle"
              className={styles.axisLabel}
            >
              {date}
            </text>
          );
        })}

        {hoveredIndex !== null && anchorX !== null && (
          <line
            x1={anchorX}
            y1={CHART.padding.top}
            x2={anchorX}
            y2={CHART.height - CHART.padding.bottom}
            className={styles.hoverLine}
          />
        )}

        {series.map((item) => (
          <path
            key={item.label}
            d={buildLinePath(item.points, maxY)}
            className={`${styles.line} ${item.dashed ? styles.lineMuted : ""}`}
            stroke={item.color}
          />
        ))}

        {series.map((item) =>
          buildDots(item.points, maxY).map((dot) => {
            const isActive = hoveredIndex === dot.index;
            return (
              <g key={`${item.label}-${dot.key}`}>
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={14}
                  fill="transparent"
                  className={styles.hitArea}
                  onMouseEnter={() => setHoveredIndex(dot.index)}
                />
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={isActive ? 6 : 4}
                  fill={item.color}
                  className={styles.dot}
                  pointerEvents="none"
                />
              </g>
            );
          })
        )}
      </svg>
      </div>
    </div>
  );
}

export default function AdminSalesChart({
  salesOverview = null,
  loading = false,
}) {
  const overview = salesOverview ?? fallbackSalesOverview;
  const chartMaxY = overview.maxY ?? 2500;

  const overviewSeries = useMemo(
    () => [
      {
        label: overview.thisPeriod.label,
        color: PRIMARY_COLOR,
        dashed: false,
        points: overview.thisPeriod.points,
      },
      {
        label: overview.lastPeriod.label,
        color: "#6b7280",
        dashed: true,
        points: overview.lastPeriod.points,
      },
    ],
    [overview]
  );

  const yTicks = useMemo(() => {
    if (chartMaxY <= 0) return [0, 500, 1000, 1500, 2000, 2500];
    const step =
      chartMaxY <= 2500 ? 500 : Math.max(500, Math.ceil(chartMaxY / 5 / 500) * 500);
    const ticks = [];
    for (let v = 0; v <= chartMaxY; v += step) {
      ticks.push(v);
    }
    if (ticks[ticks.length - 1] !== chartMaxY) ticks.push(chartMaxY);
    return ticks.length > 1 ? ticks : [0, chartMaxY];
  }, [chartMaxY]);

  return (
    <section className={styles.panel}>
      <SalesLineChart
        series={overviewSeries}
        maxY={chartMaxY}
        yTicks={yTicks}
        showComparison
        loading={loading}
      />

      <div className={styles.legend}>
        {overviewSeries.map((item) => (
          <span key={item.label} className={styles.legendItem}>
            <span
              className={`${styles.legendLine} ${item.dashed ? styles.legendLineDashed : ""}`}
              style={{ borderTopColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}
