import { Text, View } from 'react-native';
import type { ColorValue } from 'react-native';

import { SymbolIcon } from '@/src/symbol-icon';
import { colors } from '@/src/theme/colors';

interface MetricCardProps {
  title: string;
  symbol: string;
  tint: ColorValue;
  value: number | null;
  displayValue: string | null;
  unit: string;
  date: Date | null;
  subtitle?: string;
  subtitleTint?: ColorValue;
  chart?: number[];
}

function formatMeta(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  const isToday = date.toDateString() === new Date().toDateString();
  if (isToday) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export function MetricCard({
  title,
  symbol,
  tint,
  value,
  displayValue,
  unit,
  date,
  subtitle,
  subtitleTint,
  chart,
}: MetricCardProps) {
  const maxChart = Math.max(1, ...(chart ?? [0]));
  const hasValue = value != null && displayValue != null;
  const isOk = displayValue === 'OK';
  const meta = formatMeta(date);

  return (
    <View
      style={{
        backgroundColor: colors.systemBackground,
        borderRadius: 24,
        borderCurve: 'continuous',
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 18,
        minHeight: 118,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1, paddingRight: 12 }}>
          <SymbolIcon name={symbol} size={18} tint={tint} />
          <Text style={{ color: tint, fontSize: 16, fontWeight: '600' }} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          {meta ? (
            <Text style={{ color: colors.secondaryLabel, fontSize: 16 }}>{meta}</Text>
          ) : null}
          <SymbolIcon name="chevron.right" size={12} tint={colors.secondaryLabel} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', minHeight: 56 }}>
        {hasValue ? (
          <View style={{ flex: 1, gap: 2 }}>
            {subtitle ? (
              <Text
                style={{
                  color: subtitleTint ?? colors.secondaryLabel,
                  fontSize: 16,
                  fontWeight: subtitleTint ? '600' : '400',
                }}
              >
                {subtitle}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isOk ? (
                <SymbolIcon name="checkmark.circle.fill" size={32} tint={colors.systemGreen} />
              ) : null}
              <Text
                selectable
                style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: colors.label,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {displayValue}
                {unit ? (
                  <Text style={{ fontSize: 17, fontWeight: '400', color: colors.secondaryLabel }}>
                    {' '}
                    {unit}
                  </Text>
                ) : null}
              </Text>
            </View>
          </View>
        ) : (
          <Text
            style={{
              fontSize: 34,
              fontWeight: '700',
              color: colors.label,
              paddingVertical: 4,
            }}
          >
            No Data
          </Text>
        )}
        {chart ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 52, paddingBottom: 4 }}>
            {chart.map((item, index) => (
              <View key={`${title}-${index}`} style={{ width: 6, height: 52, justifyContent: 'flex-end' }}>
                <View
                  style={{
                    width: 6,
                    borderRadius: 3,
                    height: Math.max(4, (item / maxChart) * 48),
                    backgroundColor: index === chart.length - 1 ? tint : colors.systemFill,
                  }}
                />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
