package expo.modules.healthkit

internal object HealthConnectUnits {
  fun toRequested(canonical: Double, unit: String, kind: QuantityKind): Double {
    if (unit.isEmpty()) return canonical
    return when (kind) {
      QuantityKind.COUNT, QuantityKind.BPM, QuantityKind.FLOORS, QuantityKind.VO2, QuantityKind.HRV -> canonical
      QuantityKind.PERCENT -> if (unit == "%") canonical else canonical * 100.0
      QuantityKind.MASS -> massFromKg(canonical, unit)
      QuantityKind.LENGTH -> lengthFromMeters(canonical, unit)
      QuantityKind.ENERGY -> energyFromKcal(canonical, unit)
      QuantityKind.TEMPERATURE -> temperatureFromCelsius(canonical, unit)
      QuantityKind.PRESSURE -> if (unit == "mmHg") canonical else canonical
      QuantityKind.VOLUME -> volumeFromLiters(canonical, unit)
      QuantityKind.GLUCOSE -> glucoseFromMgDl(canonical, unit)
    }
  }

  fun toCanonical(value: Double, unit: String, kind: QuantityKind): Double {
    if (unit.isEmpty()) return value
    return when (kind) {
      QuantityKind.COUNT, QuantityKind.BPM, QuantityKind.FLOORS, QuantityKind.VO2, QuantityKind.HRV -> value
      QuantityKind.PERCENT -> if (unit == "%" && value > 1.0) value / 100.0 else value
      QuantityKind.MASS -> massToKg(value, unit)
      QuantityKind.LENGTH -> lengthToMeters(value, unit)
      QuantityKind.ENERGY -> energyToKcal(value, unit)
      QuantityKind.TEMPERATURE -> temperatureToCelsius(value, unit)
      QuantityKind.PRESSURE -> value
      QuantityKind.VOLUME -> volumeToLiters(value, unit)
      QuantityKind.GLUCOSE -> glucoseToMgDl(value, unit)
    }
  }

  private fun massToKg(value: Double, unit: String): Double = when (unit) {
    "kg" -> value
    "g" -> value / 1000.0
    "mg" -> value / 1_000_000.0
    "lb" -> value / 2.2046226218
    else -> value
  }

  private fun massFromKg(value: Double, unit: String): Double = when (unit) {
    "kg" -> value
    "g" -> value * 1000.0
    "mg" -> value * 1_000_000.0
    "lb" -> value * 2.2046226218
    else -> value
  }

  private fun lengthToMeters(value: Double, unit: String): Double = when (unit) {
    "m" -> value
    "km" -> value * 1000.0
    "cm" -> value / 100.0
    "mi" -> value * 1609.344
    "ft" -> value * 0.3048
    "in" -> value * 0.0254
    else -> value
  }

  private fun lengthFromMeters(value: Double, unit: String): Double = when (unit) {
    "m" -> value
    "km" -> value / 1000.0
    "cm" -> value * 100.0
    "mi" -> value / 1609.344
    "ft" -> value / 0.3048
    "in" -> value / 0.0254
    else -> value
  }

  private fun energyToKcal(value: Double, unit: String): Double = when (unit) {
    "kcal" -> value
    "J" -> value / 4184.0
    else -> value
  }

  private fun energyFromKcal(value: Double, unit: String): Double = when (unit) {
    "kcal" -> value
    "J" -> value * 4184.0
    else -> value
  }

  private fun temperatureToCelsius(value: Double, unit: String): Double = when (unit) {
    "degC" -> value
    "degF" -> (value - 32.0) * 5.0 / 9.0
    else -> value
  }

  private fun temperatureFromCelsius(value: Double, unit: String): Double = when (unit) {
    "degC" -> value
    "degF" -> value * 9.0 / 5.0 + 32.0
    else -> value
  }

  private fun volumeToLiters(value: Double, unit: String): Double = when (unit) {
    "L" -> value
    "mL" -> value / 1000.0
    else -> value
  }

  private fun volumeFromLiters(value: Double, unit: String): Double = when (unit) {
    "L" -> value
    "mL" -> value * 1000.0
    else -> value
  }

  private fun glucoseToMgDl(value: Double, unit: String): Double = when {
    unit == "mg/dL" -> value
    unit.startsWith("mmol") -> value * 18.018
    else -> value
  }

  private fun glucoseFromMgDl(value: Double, unit: String): Double = when {
    unit == "mg/dL" -> value
    unit.startsWith("mmol") -> value / 18.018
    else -> value
  }
}

internal enum class QuantityKind {
  COUNT,
  MASS,
  LENGTH,
  ENERGY,
  TEMPERATURE,
  PRESSURE,
  VOLUME,
  GLUCOSE,
  PERCENT,
  BPM,
  FLOORS,
  VO2,
  HRV
}
