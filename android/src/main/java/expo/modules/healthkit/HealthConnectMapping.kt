package expo.modules.healthkit

import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.BloodGlucoseRecord
import androidx.health.connect.client.records.BloodPressureRecord
import androidx.health.connect.client.records.BodyFatRecord
import androidx.health.connect.client.records.BodyTemperatureRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.FloorsClimbedRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.HeightRecord
import androidx.health.connect.client.records.HydrationRecord
import androidx.health.connect.client.records.LeanBodyMassRecord
import androidx.health.connect.client.records.NutritionRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.RespiratoryRateRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.Vo2MaxRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.records.WheelchairPushesRecord
import kotlin.reflect.KClass

internal object HealthConnectMapping {
  const val STEPS = "HKQuantityTypeIdentifierStepCount"
  const val DISTANCE_WALKING = "HKQuantityTypeIdentifierDistanceWalkingRunning"
  const val DISTANCE_CYCLING = "HKQuantityTypeIdentifierDistanceCycling"
  const val DISTANCE_SWIMMING = "HKQuantityTypeIdentifierDistanceSwimming"
  const val DISTANCE_WHEELCHAIR = "HKQuantityTypeIdentifierDistanceWheelchair"
  const val ACTIVE_ENERGY = "HKQuantityTypeIdentifierActiveEnergyBurned"
  const val BASAL_ENERGY = "HKQuantityTypeIdentifierBasalEnergyBurned"
  const val FLOORS = "HKQuantityTypeIdentifierFlightsClimbed"
  const val PUSH_COUNT = "HKQuantityTypeIdentifierPushCount"
  const val VO2_MAX = "HKQuantityTypeIdentifierVO2Max"
  const val HEART_RATE = "HKQuantityTypeIdentifierHeartRate"
  const val RESTING_HEART_RATE = "HKQuantityTypeIdentifierRestingHeartRate"
  const val HRV = "HKQuantityTypeIdentifierHeartRateVariabilitySDNN"
  const val OXYGEN = "HKQuantityTypeIdentifierOxygenSaturation"
  const val RESPIRATORY = "HKQuantityTypeIdentifierRespiratoryRate"
  const val BODY_TEMP = "HKQuantityTypeIdentifierBodyTemperature"
  const val GLUCOSE = "HKQuantityTypeIdentifierBloodGlucose"
  const val SYSTOLIC = "HKQuantityTypeIdentifierBloodPressureSystolic"
  const val DIASTOLIC = "HKQuantityTypeIdentifierBloodPressureDiastolic"
  const val HEIGHT = "HKQuantityTypeIdentifierHeight"
  const val WEIGHT = "HKQuantityTypeIdentifierBodyMass"
  const val LEAN_MASS = "HKQuantityTypeIdentifierLeanBodyMass"
  const val BODY_FAT = "HKQuantityTypeIdentifierBodyFatPercentage"
  const val WATER = "HKQuantityTypeIdentifierDietaryWater"
  const val SLEEP = "HKCategoryTypeIdentifierSleepAnalysis"
  const val WORKOUT = "HKWorkoutTypeIdentifier"
  const val BLOOD_PRESSURE = "HKCorrelationTypeIdentifierBloodPressure"
  const val FOOD = "HKCorrelationTypeIdentifierFood"

  fun recordClass(identifier: String): KClass<out Record>? = when (identifier) {
    STEPS -> StepsRecord::class
    DISTANCE_WALKING, DISTANCE_CYCLING, DISTANCE_SWIMMING, DISTANCE_WHEELCHAIR -> DistanceRecord::class
    ACTIVE_ENERGY -> ActiveCaloriesBurnedRecord::class
    BASAL_ENERGY -> TotalCaloriesBurnedRecord::class
    FLOORS -> FloorsClimbedRecord::class
    PUSH_COUNT -> WheelchairPushesRecord::class
    VO2_MAX -> Vo2MaxRecord::class
    HEART_RATE -> HeartRateRecord::class
    RESTING_HEART_RATE -> RestingHeartRateRecord::class
    HRV -> HeartRateVariabilityRmssdRecord::class
    OXYGEN -> OxygenSaturationRecord::class
    RESPIRATORY -> RespiratoryRateRecord::class
    BODY_TEMP -> BodyTemperatureRecord::class
    GLUCOSE -> BloodGlucoseRecord::class
    SYSTOLIC, DIASTOLIC, BLOOD_PRESSURE -> BloodPressureRecord::class
    HEIGHT -> HeightRecord::class
    WEIGHT -> WeightRecord::class
    LEAN_MASS -> LeanBodyMassRecord::class
    BODY_FAT -> BodyFatRecord::class
    WATER -> HydrationRecord::class
    SLEEP -> SleepSessionRecord::class
    WORKOUT -> ExerciseSessionRecord::class
    FOOD -> NutritionRecord::class
    else -> if (isDietary(identifier)) NutritionRecord::class else null
  }

  fun extraRecordClasses(identifier: String): List<KClass<out Record>> =
    if (identifier == BASAL_ENERGY) listOf(ActiveCaloriesBurnedRecord::class) else emptyList()

  fun permissions(identifiers: List<String>, write: Boolean): Set<String> {
    val classes = linkedSetOf<KClass<out Record>>()
    for (identifier in identifiers) {
      val primary = recordClass(identifier) ?: continue
      classes += primary
      classes += extraRecordClasses(identifier)
    }
    return classes.mapTo(mutableSetOf()) { record ->
      if (write) HealthPermission.getWritePermission(record) else HealthPermission.getReadPermission(record)
    }
  }

  fun quantityKind(identifier: String): QuantityKind = when (identifier) {
    STEPS, PUSH_COUNT, FLOORS -> if (identifier == FLOORS) QuantityKind.FLOORS else QuantityKind.COUNT
    HEART_RATE, RESTING_HEART_RATE -> QuantityKind.BPM
    HRV -> QuantityKind.HRV
    VO2_MAX -> QuantityKind.VO2
    ACTIVE_ENERGY, BASAL_ENERGY, DIETARY_ENERGY -> QuantityKind.ENERGY
    OXYGEN, BODY_FAT -> QuantityKind.PERCENT
    RESPIRATORY -> QuantityKind.COUNT
    BODY_TEMP -> QuantityKind.TEMPERATURE
    GLUCOSE -> QuantityKind.GLUCOSE
    SYSTOLIC, DIASTOLIC -> QuantityKind.PRESSURE
    HEIGHT, DISTANCE_WALKING, DISTANCE_CYCLING, DISTANCE_SWIMMING, DISTANCE_WHEELCHAIR -> QuantityKind.LENGTH
    WEIGHT, LEAN_MASS -> QuantityKind.MASS
    WATER -> QuantityKind.VOLUME
    else -> if (identifier == DIETARY_ENERGY) QuantityKind.ENERGY else if (isDietary(identifier)) QuantityKind.MASS else QuantityKind.COUNT
  }

  fun isCumulative(identifier: String): Boolean = when (identifier) {
    STEPS, DISTANCE_WALKING, DISTANCE_CYCLING, DISTANCE_SWIMMING, DISTANCE_WHEELCHAIR,
    ACTIVE_ENERGY, BASAL_ENERGY, FLOORS, PUSH_COUNT, WATER -> true
    else -> isDietary(identifier)
  }

  fun isDietary(identifier: String): Boolean =
    identifier.startsWith("HKQuantityTypeIdentifierDietary")

  const val DIETARY_ENERGY = "HKQuantityTypeIdentifierDietaryEnergyConsumed"
}
