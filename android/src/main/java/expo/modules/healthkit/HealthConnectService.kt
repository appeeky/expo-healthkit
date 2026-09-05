package expo.modules.healthkit

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.aggregate.AggregationResult
import androidx.health.connect.client.changes.DeletionChange
import androidx.health.connect.client.changes.UpsertionChange
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
import androidx.health.connect.client.records.MealType
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
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.request.AggregateGroupByDurationRequest
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ChangesTokenRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.health.connect.client.units.BloodGlucose
import androidx.health.connect.client.units.Energy
import androidx.health.connect.client.units.Length
import androidx.health.connect.client.units.Mass
import androidx.health.connect.client.units.Percentage
import androidx.health.connect.client.units.Pressure
import androidx.health.connect.client.units.Temperature
import androidx.health.connect.client.units.Volume
import java.time.Duration
import java.time.Instant
import java.time.LocalDateTime
import java.time.Period
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import kotlin.math.max
import kotlin.reflect.KClass

internal class HealthConnectService(
  private val context: Context,
  private val requestPermissions: suspend (Set<String>) -> Set<String>
) {
  fun isAvailable(): Boolean = isAvailable(context)

  suspend fun requestAuthorization(options: Map<String, Any?>): Boolean {
    assertAvailable()
    val toRead = stringList(options["toRead"])
    val toShare = stringList(options["toShare"])
    val permissions = HealthConnectMapping.permissions(toRead, write = false) +
      HealthConnectMapping.permissions(toShare, write = true)
    if (toRead.isEmpty() && toShare.isEmpty()) {
      throw EmptyPermissionsException()
    }
    if (permissions.isEmpty()) {
      return true
    }
    val requested = permissions.toMutableSet()
    if (toRead.isNotEmpty()) {
      requested += androidx.health.connect.client.permission.HealthPermission.PERMISSION_READ_HEALTH_DATA_HISTORY
    }
    val granted = client().permissionController.getGrantedPermissions()
    if (granted.containsAll(requested)) {
      return true
    }
    val result = requestPermissions(requested)
    return result.containsAll(permissions)
  }

  suspend fun authorizationStatus(identifier: String): Int {
    assertAvailable()
    val recordClass = HealthConnectMapping.recordClass(identifier) ?: return 0
    val granted = client().permissionController.getGrantedPermissions()
    val write = androidx.health.connect.client.permission.HealthPermission.getWritePermission(recordClass)
    val read = androidx.health.connect.client.permission.HealthPermission.getReadPermission(recordClass)
    return if (write in granted || read in granted) 2 else 0
  }

  suspend fun requestStatusForAuthorization(options: Map<String, Any?>): Int {
    assertAvailable()
    val permissions = HealthConnectMapping.permissions(stringList(options["toRead"]), write = false) +
      HealthConnectMapping.permissions(stringList(options["toShare"]), write = true)
    if (permissions.isEmpty()) {
      return 2
    }
    val granted = client().permissionController.getGrantedPermissions()
    return if (granted.containsAll(permissions)) 2 else 1
  }

  suspend fun queryQuantitySamples(options: Map<String, Any?>): List<Map<String, Any?>> {
    assertAvailable()
    val type = requiredString(options, "type")
    val unit = options["unit"] as? String ?: ""
    val filter = timeFilter(options)
    val limit = intValue(options["limit"])
    val ascending = options["ascending"] as? Boolean ?: false
    return quantitySamples(type, unit, filter, limit, ascending)
  }

  suspend fun queryCategorySamples(options: Map<String, Any?>): List<Map<String, Any?>> {
    assertAvailable()
    val type = requiredString(options, "type")
    val filter = timeFilter(options)
    val limit = intValue(options["limit"])
    val ascending = options["ascending"] as? Boolean ?: false
    return when (type) {
      HealthConnectMapping.SLEEP -> {
        val sessions = readAll(SleepSessionRecord::class, filter, ascending, 0)
        val samples = sessions.flatMap { session -> sleepSamples(session) }
        applyLimit(if (ascending) samples else samples.reversed(), limit)
      }
      else -> throw HealthConnectUnsupportedException(type)
    }
  }

  suspend fun queryWorkouts(options: Map<String, Any?>): List<Map<String, Any?>> {
    assertAvailable()
    val filter = timeFilter(options)
    val limit = intValue(options["limit"])
    val ascending = options["ascending"] as? Boolean ?: false
    val activityType = (options["activityType"] as? Number)?.toInt()
    val records = readAll(ExerciseSessionRecord::class, filter, ascending, 0)
    val mapped = records.mapNotNull { record ->
      val hkType = HealthConnectWorkouts.toHealthKit(record.exerciseType)
      if (activityType != null && hkType != activityType) {
        return@mapNotNull null
      }
      workoutSample(record, hkType)
    }
    return applyLimit(mapped, limit)
  }

  suspend fun queryCorrelations(options: Map<String, Any?>): List<Map<String, Any?>> {
    assertAvailable()
    val type = requiredString(options, "type")
    val filter = timeFilter(options)
    val limit = intValue(options["limit"])
    val ascending = options["ascending"] as? Boolean ?: false
    return when (type) {
      HealthConnectMapping.BLOOD_PRESSURE -> {
        readAll(BloodPressureRecord::class, filter, ascending, limit).map { record ->
          correlation(
            record.metadata,
            type,
            record.time,
            record.time,
            listOf(
              quantitySample(
                record.metadata,
                HealthConnectMapping.SYSTOLIC,
                record.time,
                record.time,
                HealthConnectUnits.toRequested(
                  record.systolic.inMillimetersOfMercury,
                  "mmHg",
                  QuantityKind.PRESSURE
                ),
                "mmHg"
              ),
              quantitySample(
                record.metadata,
                HealthConnectMapping.DIASTOLIC,
                record.time,
                record.time,
                HealthConnectUnits.toRequested(
                  record.diastolic.inMillimetersOfMercury,
                  "mmHg",
                  QuantityKind.PRESSURE
                ),
                "mmHg"
              )
            )
          )
        }
      }
      HealthConnectMapping.FOOD -> {
        readAll(NutritionRecord::class, filter, ascending, limit).map { record ->
          val objects = HealthConnectNutrition.presentFields(record).map { (identifier, canonical) ->
            val kind = HealthConnectMapping.quantityKind(identifier)
            val unit = if (kind == QuantityKind.ENERGY) "kcal" else "g"
            val value = if (kind == QuantityKind.MASS) {
              HealthConnectUnits.toRequested(canonical, "g", kind)
            } else {
              canonical
            }
            quantitySample(record.metadata, identifier, record.startTime, record.endTime, value, unit)
          }
          correlation(record.metadata, type, record.startTime, record.endTime, objects)
        }
      }
      else -> unmappedType(type)
    }
  }

  suspend fun queryStatistics(options: Map<String, Any?>): Map<String, Any?> {
    assertAvailable()
    val type = requiredString(options, "type")
    val unit = options["unit"] as? String ?: ""
    val filter = timeFilter(options)
    val bits = intValue(options["options"])
    val start = filterStart(options)
    val end = filterEnd(options)
    return statisticsRecord(type, unit, start, end, bits, aggregate(type, filter, bits), latestValue(type, unit, filter, bits))
  }

  suspend fun queryStatisticsCollection(options: Map<String, Any?>): List<Map<String, Any?>> {
    assertAvailable()
    val type = requiredString(options, "type")
    val unit = options["unit"] as? String ?: ""
    val filter = timeFilter(options)
    val bits = intValue(options["options"])
    val year = intValue(options["year"])
    val month = intValue(options["month"])
    val day = intValue(options["day"])
    val hour = intValue(options["hour"])
    val minute = intValue(options["minute"])
    val second = intValue(options["second"])
    val metrics = aggregateMetrics(type, bits)
    if (metrics.isEmpty()) {
      return emptyList()
    }
    val durationBased = hour > 0 || minute > 0 || second > 0
    return if (durationBased) {
      val duration = Duration.ofHours(max(hour, 0).toLong())
        .plusMinutes(max(minute, 0).toLong())
        .plusSeconds(max(second, 0).toLong())
        .let { if (it.isZero) Duration.ofHours(1) else it }
      client().aggregateGroupByDuration(
        AggregateGroupByDurationRequest(metrics, filter, duration)
      ).map { result ->
        statisticsRecord(type, unit, result.startTime, result.endTime, bits, result.result, null)
      }
    } else {
      val period = when {
        year > 0 -> Period.ofYears(year)
        month > 0 -> Period.ofMonths(month)
        day > 0 -> Period.ofDays(day)
        else -> Period.ofDays(1)
      }
      client().aggregateGroupByPeriod(
        AggregateGroupByPeriodRequest(metrics, localTimeFilter(options), period)
      ).map { result ->
        val start = result.startTime.atZone(ZoneId.systemDefault()).toInstant()
        val end = result.endTime.atZone(ZoneId.systemDefault()).toInstant()
        statisticsRecord(type, unit, start, end, bits, result.result, null)
      }
    }
  }

  suspend fun queryAnchored(options: Map<String, Any?>): Map<String, Any?> {
    assertAvailable()
    val type = requiredString(options, "type")
    val unit = options["unit"] as? String ?: ""
    val recordClass = HealthConnectMapping.recordClass(type) ?: unmappedType(type)
    val anchor = options["anchor"] as? String
    val client = client()
    if (anchor.isNullOrBlank()) {
      val samples = quantitySamples(type, unit, timeFilter(options), intValue(options["limit"]), options["ascending"] as? Boolean ?: true)
      val token = client.getChangesToken(ChangesTokenRequest(setOf(recordClass)))
      return mapOf("added" to samples, "deleted" to emptyList<Map<String, Any?>>(), "anchor" to token)
    }
    return try {
      var token = requireNotNull(anchor)
      val added = mutableListOf<Map<String, Any?>>()
      val deleted = mutableListOf<Map<String, Any?>>()
      while (true) {
        val changes = client.getChanges(token)
        if (changes.changesTokenExpired) {
          val samples = quantitySamples(type, unit, timeFilter(options), intValue(options["limit"]), true)
          val fresh = client.getChangesToken(ChangesTokenRequest(setOf(recordClass)))
          return mapOf("added" to samples, "deleted" to emptyList<Map<String, Any?>>(), "anchor" to fresh)
        }
        for (change in changes.changes) {
          when (change) {
            is UpsertionChange -> added += quantitySamplesFromRecord(type, unit, change.record)
            is DeletionChange -> deleted += mapOf("uuid" to change.recordId, "type" to type)
          }
        }
        token = changes.nextChangesToken
        if (!changes.hasMore) break
      }
      mapOf("added" to added, "deleted" to deleted, "anchor" to token)
    } catch (_: Exception) {
      val samples = quantitySamples(type, unit, timeFilter(options), intValue(options["limit"]), true)
      val token = client.getChangesToken(ChangesTokenRequest(setOf(recordClass)))
      mapOf("added" to samples, "deleted" to emptyList<Map<String, Any?>>(), "anchor" to token)
    }
  }

  suspend fun saveQuantitySample(input: Map<String, Any?>): String {
    assertAvailable()
    val type = requiredString(input, "type")
    val unit = requiredString(input, "unit")
    val value = (input["value"] as? Number)?.toDouble() ?: 0.0
    val start = parseInstant(requiredString(input, "startDate"))
    val end = parseInstant(input["endDate"] as? String ?: requiredString(input, "startDate"))
    val canonical = HealthConnectUnits.toCanonical(value, unit, HealthConnectMapping.quantityKind(type))
    val record = quantityRecord(type, canonical, ensureRange(start, end).first, ensureRange(start, end).second)
      ?: throw InvalidSampleTypeException(type)
    val ids = client().insertRecords(listOf(record))
    return ids.recordIdsList.first()
  }

  suspend fun saveCategorySample(input: Map<String, Any?>): String {
    assertAvailable()
    val type = requiredString(input, "type")
    val value = intValue(input["value"])
    val start = parseInstant(requiredString(input, "startDate"))
    val end = parseInstant(input["endDate"] as? String ?: requiredString(input, "startDate"))
    val range = ensureRange(start, end)
    val offset = zoneOffset(range.first)
    val record: Record = when (type) {
      HealthConnectMapping.SLEEP -> SleepSessionRecord(
        startTime = range.first,
        startZoneOffset = offset,
        endTime = range.second,
        endZoneOffset = zoneOffset(range.second),
        stages = listOf(
          SleepSessionRecord.Stage(range.first, range.second, toSleepStage(value))
        ),
        metadata = metadata()
      )
      else -> throw InvalidSampleTypeException(type)
    }
    return client().insertRecords(listOf(record)).recordIdsList.first()
  }

  suspend fun saveWorkout(input: Map<String, Any?>): String {
    assertAvailable()
    val start = parseInstant(requiredString(input, "startDate"))
    val end = parseInstant(requiredString(input, "endDate"))
    val range = ensureRange(start, end)
    val activityType = intValue(input["activityType"])
    val records = mutableListOf<Record>(
      ExerciseSessionRecord(
        startTime = range.first,
        startZoneOffset = zoneOffset(range.first),
        endTime = range.second,
        endZoneOffset = zoneOffset(range.second),
        exerciseType = HealthConnectWorkouts.toHealthConnect(activityType),
        metadata = metadata()
      )
    )
    val energy = (input["energyBurned"] as? Number)?.toDouble()
    val energyUnit = input["energyBurnedUnit"] as? String ?: "kcal"
    if (energy != null) {
      records += ActiveCaloriesBurnedRecord(
        startTime = range.first,
        startZoneOffset = zoneOffset(range.first),
        endTime = range.second,
        endZoneOffset = zoneOffset(range.second),
        energy = Energy.kilocalories(HealthConnectUnits.toCanonical(energy, energyUnit, QuantityKind.ENERGY)),
        metadata = metadata()
      )
    }
    val distance = (input["distance"] as? Number)?.toDouble()
    val distanceUnit = input["distanceUnit"] as? String ?: "m"
    if (distance != null) {
      records += DistanceRecord(
        startTime = range.first,
        startZoneOffset = zoneOffset(range.first),
        endTime = range.second,
        endZoneOffset = zoneOffset(range.second),
        distance = Length.meters(HealthConnectUnits.toCanonical(distance, distanceUnit, QuantityKind.LENGTH)),
        metadata = metadata()
      )
    }
    return client().insertRecords(records).recordIdsList.first()
  }

  suspend fun saveCorrelation(input: Map<String, Any?>): String {
    assertAvailable()
    val type = requiredString(input, "type")
    val start = parseInstant(requiredString(input, "startDate"))
    val end = parseInstant(input["endDate"] as? String ?: requiredString(input, "startDate"))
    val objects = (input["objects"] as? List<*>)?.mapNotNull { item ->
      @Suppress("UNCHECKED_CAST")
      item as? Map<String, Any?>
    } ?: emptyList()
    if (objects.isEmpty()) {
      throw EmptyCorrelationException()
    }
    val record = when (type) {
      HealthConnectMapping.BLOOD_PRESSURE -> {
        var systolic: Double? = null
        var diastolic: Double? = null
        for (item in objects) {
          val identifier = item["type"] as? String ?: continue
          val unit = item["unit"] as? String ?: "mmHg"
          val value = (item["value"] as? Number)?.toDouble() ?: continue
          val mmHg = HealthConnectUnits.toCanonical(value, unit, QuantityKind.PRESSURE)
          when (identifier) {
            HealthConnectMapping.SYSTOLIC -> systolic = mmHg
            HealthConnectMapping.DIASTOLIC -> diastolic = mmHg
          }
        }
        if (systolic == null || diastolic == null) {
          throw EmptyCorrelationException()
        }
        BloodPressureRecord(
          time = start,
          zoneOffset = zoneOffset(start),
          systolic = Pressure.millimetersOfMercury(systolic),
          diastolic = Pressure.millimetersOfMercury(diastolic),
          metadata = metadata()
        )
      }
      HealthConnectMapping.FOOD -> {
        val values = mutableMapOf<String, Double>()
        for (item in objects) {
          val identifier = item["type"] as? String ?: continue
          val unit = item["unit"] as? String ?: ""
          val value = (item["value"] as? Number)?.toDouble() ?: continue
          values[identifier] = HealthConnectUnits.toCanonical(value, unit, HealthConnectMapping.quantityKind(identifier))
        }
        val range = ensureRange(start, end)
        HealthConnectNutrition.build(range.first, range.second, zoneOffset(range.first), zoneOffset(range.second), metadata(), values)
      }
      else -> unmappedType(type)
    }
    return client().insertRecords(listOf(record)).recordIdsList.first()
  }

  suspend fun deleteObjects(options: Map<String, Any?>): Int {
    assertAvailable()
    val type = options["type"] as? String ?: throw MissingDeleteTypeException()
    val recordClass = HealthConnectMapping.recordClass(type) ?: unmappedType(type)
    val uuid = options["uuid"] as? String
    val client = client()
    if (!uuid.isNullOrBlank()) {
      client.deleteRecords(recordClass, listOf(uuid), emptyList())
      return 1
    }
    val filter = timeFilter(options)
    val existing = readAll(recordClass, filter, true, 0)
    if (existing.isEmpty()) {
      return 0
    }
    client.deleteRecords(recordClass, existing.map { it.metadata.id }, emptyList())
    return existing.size
  }

  fun unsupported(feature: String) {
    throw HealthConnectUnsupportedException(feature)
  }

  private suspend fun quantitySamples(
    type: String,
    unit: String,
    filter: TimeRangeFilter,
    limit: Int,
    ascending: Boolean
  ): List<Map<String, Any?>> {
    val samples = when (type) {
      HealthConnectMapping.HEART_RATE -> {
        readAll(HeartRateRecord::class, filter, ascending, 0).flatMap { record ->
          record.samples.map { sample ->
            quantitySample(
              record.metadata,
              type,
              sample.time,
              sample.time,
              HealthConnectUnits.toRequested(sample.beatsPerMinute.toDouble(), unit, QuantityKind.BPM),
              unit
            )
          }
        }
      }
      HealthConnectMapping.BASAL_ENERGY -> emptyList()
      else -> {
        val recordClass = HealthConnectMapping.recordClass(type) ?: unmappedType(type)
        readAll(recordClass, filter, ascending, 0).flatMap { record ->
          quantitySamplesFromRecord(type, unit, record)
        }
      }
    }
    val ordered = if (ascending) samples else samples.reversed()
    return applyLimit(ordered, limit)
  }

  private fun quantitySamplesFromRecord(type: String, unit: String, record: Record): List<Map<String, Any?>> {
    val kind = HealthConnectMapping.quantityKind(type)
    return when (record) {
      is StepsRecord -> listOf(
        quantitySample(record.metadata, type, record.startTime, record.endTime, HealthConnectUnits.toRequested(record.count.toDouble(), unit, kind), unit)
      )
      is DistanceRecord -> listOf(
        quantitySample(record.metadata, type, record.startTime, record.endTime, HealthConnectUnits.toRequested(record.distance.inMeters, unit, kind), unit)
      )
      is ActiveCaloriesBurnedRecord -> listOf(
        quantitySample(record.metadata, type, record.startTime, record.endTime, HealthConnectUnits.toRequested(record.energy.inKilocalories, unit, kind), unit)
      )
      is FloorsClimbedRecord -> listOf(
        quantitySample(record.metadata, type, record.startTime, record.endTime, HealthConnectUnits.toRequested(record.floors, unit, kind), unit)
      )
      is WheelchairPushesRecord -> listOf(
        quantitySample(record.metadata, type, record.startTime, record.endTime, HealthConnectUnits.toRequested(record.count.toDouble(), unit, kind), unit)
      )
      is HeartRateRecord -> record.samples.map { sample ->
        quantitySample(record.metadata, type, sample.time, sample.time, HealthConnectUnits.toRequested(sample.beatsPerMinute.toDouble(), unit, kind), unit)
      }
      is RestingHeartRateRecord -> listOf(
        quantitySample(record.metadata, type, record.time, record.time, HealthConnectUnits.toRequested(record.beatsPerMinute.toDouble(), unit, kind), unit)
      )
      is HeartRateVariabilityRmssdRecord -> listOf(
        quantitySample(record.metadata, type, record.time, record.time, HealthConnectUnits.toRequested(record.heartRateVariabilityMillis, unit, kind), unit)
      )
      is OxygenSaturationRecord -> listOf(
        quantitySample(record.metadata, type, record.time, record.time, HealthConnectUnits.toRequested(percentToCanonical(record.percentage), unit, kind), unit)
      )
      is RespiratoryRateRecord -> listOf(
        quantitySample(record.metadata, type, record.time, record.time, HealthConnectUnits.toRequested(record.rate, unit, kind), unit)
      )
      is BodyTemperatureRecord -> listOf(
        quantitySample(record.metadata, type, record.time, record.time, HealthConnectUnits.toRequested(record.temperature.inCelsius, unit, kind), unit)
      )
      is BloodGlucoseRecord -> listOf(
        quantitySample(record.metadata, type, record.time, record.time, HealthConnectUnits.toRequested(record.level.inMilligramsPerDeciliter, unit, kind), unit)
      )
      is HeightRecord -> listOf(
        quantitySample(record.metadata, type, record.time, record.time, HealthConnectUnits.toRequested(record.height.inMeters, unit, kind), unit)
      )
      is WeightRecord -> listOf(
        quantitySample(record.metadata, type, record.time, record.time, HealthConnectUnits.toRequested(record.weight.inKilograms, unit, kind), unit)
      )
      is LeanBodyMassRecord -> listOf(
        quantitySample(record.metadata, type, record.time, record.time, HealthConnectUnits.toRequested(record.mass.inKilograms, unit, kind), unit)
      )
      is BodyFatRecord -> listOf(
        quantitySample(record.metadata, type, record.time, record.time, HealthConnectUnits.toRequested(percentToCanonical(record.percentage), unit, kind), unit)
      )
      is Vo2MaxRecord -> listOf(
        quantitySample(record.metadata, type, record.time, record.time, HealthConnectUnits.toRequested(record.vo2MillilitersPerMinuteKilogram, unit, kind), unit)
      )
      is HydrationRecord -> listOf(
        quantitySample(record.metadata, type, record.startTime, record.endTime, HealthConnectUnits.toRequested(record.volume.inLiters, unit, kind), unit)
      )
      is BloodPressureRecord -> {
        val mmHg = if (type == HealthConnectMapping.DIASTOLIC) record.diastolic.inMillimetersOfMercury else record.systolic.inMillimetersOfMercury
        listOf(quantitySample(record.metadata, type, record.time, record.time, HealthConnectUnits.toRequested(mmHg, unit, kind), unit))
      }
      is NutritionRecord -> {
        val canonical = HealthConnectNutrition.canonicalValue(record, type) ?: return emptyList()
        listOf(quantitySample(record.metadata, type, record.startTime, record.endTime, HealthConnectUnits.toRequested(canonical, unit, kind), unit))
      }
      else -> emptyList()
    }
  }

  private fun quantityRecord(type: String, canonical: Double, start: Instant, end: Instant): Record? {
    val offset = zoneOffset(start)
    val endOffset = zoneOffset(end)
    val meta = metadata()
    return when (type) {
      HealthConnectMapping.STEPS -> StepsRecord(
        startTime = start,
        startZoneOffset = offset,
        endTime = end,
        endZoneOffset = endOffset,
        count = canonical.toLong().coerceAtLeast(1),
        metadata = meta
      )
      HealthConnectMapping.DISTANCE_WALKING, HealthConnectMapping.DISTANCE_CYCLING,
      HealthConnectMapping.DISTANCE_SWIMMING, HealthConnectMapping.DISTANCE_WHEELCHAIR ->
        DistanceRecord(
          startTime = start,
          startZoneOffset = offset,
          endTime = end,
          endZoneOffset = endOffset,
          distance = Length.meters(canonical),
          metadata = meta
        )
      HealthConnectMapping.ACTIVE_ENERGY -> ActiveCaloriesBurnedRecord(
        startTime = start,
        startZoneOffset = offset,
        endTime = end,
        endZoneOffset = endOffset,
        energy = Energy.kilocalories(canonical),
        metadata = meta
      )
      HealthConnectMapping.FLOORS -> FloorsClimbedRecord(
        startTime = start,
        startZoneOffset = offset,
        endTime = end,
        endZoneOffset = endOffset,
        floors = canonical,
        metadata = meta
      )
      HealthConnectMapping.PUSH_COUNT -> WheelchairPushesRecord(
        startTime = start,
        startZoneOffset = offset,
        endTime = end,
        endZoneOffset = endOffset,
        count = canonical.toLong().coerceAtLeast(1),
        metadata = meta
      )
      HealthConnectMapping.HEART_RATE -> HeartRateRecord(
        startTime = start,
        startZoneOffset = offset,
        endTime = end,
        endZoneOffset = endOffset,
        samples = listOf(HeartRateRecord.Sample(time = start, beatsPerMinute = canonical.toLong().coerceAtLeast(1))),
        metadata = meta
      )
      HealthConnectMapping.RESTING_HEART_RATE -> RestingHeartRateRecord(
        time = start,
        zoneOffset = offset,
        beatsPerMinute = canonical.toLong().coerceAtLeast(1),
        metadata = meta
      )
      HealthConnectMapping.HRV -> HeartRateVariabilityRmssdRecord(
        time = start,
        zoneOffset = offset,
        heartRateVariabilityMillis = canonical,
        metadata = meta
      )
      HealthConnectMapping.OXYGEN -> OxygenSaturationRecord(
        time = start,
        zoneOffset = offset,
        percentage = percentFromCanonical(canonical),
        metadata = meta
      )
      HealthConnectMapping.RESPIRATORY -> RespiratoryRateRecord(
        time = start,
        zoneOffset = offset,
        rate = canonical,
        metadata = meta
      )
      HealthConnectMapping.BODY_TEMP -> BodyTemperatureRecord(
        time = start,
        zoneOffset = offset,
        temperature = Temperature.celsius(canonical),
        metadata = meta
      )
      HealthConnectMapping.GLUCOSE -> BloodGlucoseRecord(
        time = start,
        zoneOffset = offset,
        level = BloodGlucose.milligramsPerDeciliter(canonical),
        specimenSource = BloodGlucoseRecord.SPECIMEN_SOURCE_UNKNOWN,
        mealType = MealType.MEAL_TYPE_UNKNOWN,
        relationToMeal = BloodGlucoseRecord.RELATION_TO_MEAL_UNKNOWN,
        metadata = meta
      )
      HealthConnectMapping.HEIGHT -> HeightRecord(
        time = start,
        zoneOffset = offset,
        height = Length.meters(canonical),
        metadata = meta
      )
      HealthConnectMapping.WEIGHT -> WeightRecord(
        time = start,
        zoneOffset = offset,
        weight = Mass.kilograms(canonical),
        metadata = meta
      )
      HealthConnectMapping.LEAN_MASS -> LeanBodyMassRecord(
        time = start,
        zoneOffset = offset,
        mass = Mass.kilograms(canonical),
        metadata = meta
      )
      HealthConnectMapping.BODY_FAT -> BodyFatRecord(
        time = start,
        zoneOffset = offset,
        percentage = percentFromCanonical(canonical),
        metadata = meta
      )
      HealthConnectMapping.VO2_MAX -> Vo2MaxRecord(
        time = start,
        zoneOffset = offset,
        vo2MillilitersPerMinuteKilogram = canonical,
        measurementMethod = Vo2MaxRecord.MEASUREMENT_METHOD_OTHER,
        metadata = meta
      )
      HealthConnectMapping.WATER -> HydrationRecord(
        startTime = start,
        startZoneOffset = offset,
        endTime = end,
        endZoneOffset = endOffset,
        volume = Volume.liters(canonical),
        metadata = meta
      )
      HealthConnectMapping.SYSTOLIC, HealthConnectMapping.DIASTOLIC -> null
      else -> if (HealthConnectMapping.isDietary(type)) {
        HealthConnectNutrition.build(start, end, offset, endOffset, meta, mapOf(type to canonical))
      } else {
        null
      }
    }
  }

  private suspend fun aggregate(type: String, filter: TimeRangeFilter, bits: Int): AggregationResult? {
    val metrics = aggregateMetrics(type, bits)
    if (metrics.isEmpty()) return null
    val client = client()
    return client.aggregate(AggregateRequest(metrics, filter))
  }

  private fun aggregateMetrics(type: String, bits: Int): Set<androidx.health.connect.client.aggregate.AggregateMetric<*>> {
    val useSum = hasOption(bits, OPT_SUM) || (bits == 0 && HealthConnectMapping.isCumulative(type))
    val useAvg = hasOption(bits, OPT_AVG) || (bits == 0 && !HealthConnectMapping.isCumulative(type))
    val useMin = hasOption(bits, OPT_MIN)
    val useMax = hasOption(bits, OPT_MAX)
    return when (type) {
      HealthConnectMapping.STEPS -> setOfNotNull(StepsRecord.COUNT_TOTAL.takeIf { useSum })
      HealthConnectMapping.DISTANCE_WALKING, HealthConnectMapping.DISTANCE_CYCLING,
      HealthConnectMapping.DISTANCE_SWIMMING, HealthConnectMapping.DISTANCE_WHEELCHAIR ->
        setOfNotNull(DistanceRecord.DISTANCE_TOTAL.takeIf { useSum })
      HealthConnectMapping.ACTIVE_ENERGY -> setOfNotNull(ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL.takeIf { useSum })
      HealthConnectMapping.BASAL_ENERGY -> setOf(TotalCaloriesBurnedRecord.ENERGY_TOTAL, ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL)
      HealthConnectMapping.FLOORS -> setOfNotNull(FloorsClimbedRecord.FLOORS_CLIMBED_TOTAL.takeIf { useSum })
      HealthConnectMapping.PUSH_COUNT -> setOfNotNull(WheelchairPushesRecord.COUNT_TOTAL.takeIf { useSum })
      HealthConnectMapping.HEART_RATE -> buildSet {
        if (useAvg) add(HeartRateRecord.BPM_AVG)
        if (useMin) add(HeartRateRecord.BPM_MIN)
        if (useMax) add(HeartRateRecord.BPM_MAX)
      }
      HealthConnectMapping.RESTING_HEART_RATE -> buildSet {
        if (useAvg) add(RestingHeartRateRecord.BPM_AVG)
        if (useMin) add(RestingHeartRateRecord.BPM_MIN)
        if (useMax) add(RestingHeartRateRecord.BPM_MAX)
      }
      HealthConnectMapping.WEIGHT -> buildSet {
        if (useAvg) add(WeightRecord.WEIGHT_AVG)
        if (useMin) add(WeightRecord.WEIGHT_MIN)
        if (useMax) add(WeightRecord.WEIGHT_MAX)
      }
      HealthConnectMapping.HEIGHT -> buildSet {
        if (useAvg) add(HeightRecord.HEIGHT_AVG)
        if (useMin) add(HeightRecord.HEIGHT_MIN)
        if (useMax) add(HeightRecord.HEIGHT_MAX)
      }
      HealthConnectMapping.WATER -> setOfNotNull(HydrationRecord.VOLUME_TOTAL.takeIf { useSum })
      HealthConnectMapping.DIETARY_ENERGY -> setOfNotNull(NutritionRecord.ENERGY_TOTAL.takeIf { useSum })
      HealthConnectMapping.SYSTOLIC -> buildSet {
        if (useAvg) add(BloodPressureRecord.SYSTOLIC_AVG)
        if (useMin) add(BloodPressureRecord.SYSTOLIC_MIN)
        if (useMax) add(BloodPressureRecord.SYSTOLIC_MAX)
      }
      HealthConnectMapping.DIASTOLIC -> buildSet {
        if (useAvg) add(BloodPressureRecord.DIASTOLIC_AVG)
        if (useMin) add(BloodPressureRecord.DIASTOLIC_MIN)
        if (useMax) add(BloodPressureRecord.DIASTOLIC_MAX)
      }
      else -> emptySet()
    }
  }

  private suspend fun latestValue(type: String, unit: String, filter: TimeRangeFilter, bits: Int): Double? {
    if (!hasOption(bits, OPT_RECENT)) return null
    return quantitySamples(type, unit, filter, 1, false).firstOrNull()?.get("value") as? Double
  }

  private fun statisticsRecord(
    type: String,
    unit: String,
    start: Instant,
    end: Instant,
    bits: Int,
    result: AggregationResult?,
    latest: Double?
  ): Map<String, Any?> {
    val kind = HealthConnectMapping.quantityKind(type)
    val useSum = hasOption(bits, OPT_SUM) || (bits == 0 && HealthConnectMapping.isCumulative(type))
    val useAvg = hasOption(bits, OPT_AVG) || (bits == 0 && !HealthConnectMapping.isCumulative(type))
    val record = mutableMapOf<String, Any?>(
      "startDate" to iso(start),
      "endDate" to iso(end),
      "unit" to unit
    )
    if (result != null) {
      if (useSum) numberFromAggregate(type, result, "sum")?.let {
        record["sum"] = HealthConnectUnits.toRequested(it, unit, kind)
      }
      if (useAvg) numberFromAggregate(type, result, "avg")?.let {
        record["average"] = HealthConnectUnits.toRequested(it, unit, kind)
      }
      if (hasOption(bits, OPT_MIN)) numberFromAggregate(type, result, "min")?.let {
        record["min"] = HealthConnectUnits.toRequested(it, unit, kind)
      }
      if (hasOption(bits, OPT_MAX)) numberFromAggregate(type, result, "max")?.let {
        record["max"] = HealthConnectUnits.toRequested(it, unit, kind)
      }
    }
    if (type == HealthConnectMapping.BASAL_ENERGY && result != null) {
      val total = result[TotalCaloriesBurnedRecord.ENERGY_TOTAL]?.inKilocalories ?: 0.0
      val active = result[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories ?: 0.0
      val basal = (total - active).coerceAtLeast(0.0)
      record["sum"] = HealthConnectUnits.toRequested(basal, unit, kind)
    }
    latest?.let { record["mostRecent"] = it }
    return record
  }

  private fun numberFromAggregate(type: String, result: AggregationResult, field: String): Double? {
    return when (type) {
      HealthConnectMapping.STEPS -> result[StepsRecord.COUNT_TOTAL]?.toDouble()
      HealthConnectMapping.DISTANCE_WALKING, HealthConnectMapping.DISTANCE_CYCLING,
      HealthConnectMapping.DISTANCE_SWIMMING, HealthConnectMapping.DISTANCE_WHEELCHAIR ->
        result[DistanceRecord.DISTANCE_TOTAL]?.inMeters
      HealthConnectMapping.ACTIVE_ENERGY -> result[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories
      HealthConnectMapping.FLOORS -> result[FloorsClimbedRecord.FLOORS_CLIMBED_TOTAL]
      HealthConnectMapping.PUSH_COUNT -> result[WheelchairPushesRecord.COUNT_TOTAL]?.toDouble()
      HealthConnectMapping.HEART_RATE -> when (field) {
        "avg" -> result[HeartRateRecord.BPM_AVG]?.toDouble()
        "min" -> result[HeartRateRecord.BPM_MIN]?.toDouble()
        "max" -> result[HeartRateRecord.BPM_MAX]?.toDouble()
        else -> null
      }
      HealthConnectMapping.RESTING_HEART_RATE -> when (field) {
        "avg" -> result[RestingHeartRateRecord.BPM_AVG]?.toDouble()
        "min" -> result[RestingHeartRateRecord.BPM_MIN]?.toDouble()
        "max" -> result[RestingHeartRateRecord.BPM_MAX]?.toDouble()
        else -> null
      }
      HealthConnectMapping.WEIGHT -> when (field) {
        "avg" -> result[WeightRecord.WEIGHT_AVG]?.inKilograms
        "min" -> result[WeightRecord.WEIGHT_MIN]?.inKilograms
        "max" -> result[WeightRecord.WEIGHT_MAX]?.inKilograms
        else -> null
      }
      HealthConnectMapping.HEIGHT -> when (field) {
        "avg" -> result[HeightRecord.HEIGHT_AVG]?.inMeters
        "min" -> result[HeightRecord.HEIGHT_MIN]?.inMeters
        "max" -> result[HeightRecord.HEIGHT_MAX]?.inMeters
        else -> null
      }
      HealthConnectMapping.WATER -> result[HydrationRecord.VOLUME_TOTAL]?.inLiters
      HealthConnectMapping.DIETARY_ENERGY -> result[NutritionRecord.ENERGY_TOTAL]?.inKilocalories
      HealthConnectMapping.SYSTOLIC -> when (field) {
        "avg" -> result[BloodPressureRecord.SYSTOLIC_AVG]?.inMillimetersOfMercury
        "min" -> result[BloodPressureRecord.SYSTOLIC_MIN]?.inMillimetersOfMercury
        "max" -> result[BloodPressureRecord.SYSTOLIC_MAX]?.inMillimetersOfMercury
        else -> null
      }
      HealthConnectMapping.DIASTOLIC -> when (field) {
        "avg" -> result[BloodPressureRecord.DIASTOLIC_AVG]?.inMillimetersOfMercury
        "min" -> result[BloodPressureRecord.DIASTOLIC_MIN]?.inMillimetersOfMercury
        "max" -> result[BloodPressureRecord.DIASTOLIC_MAX]?.inMillimetersOfMercury
        else -> null
      }
      else -> null
    }
  }

  private fun sleepSamples(session: SleepSessionRecord): List<Map<String, Any?>> {
    val samples = mutableListOf(
      categorySample(session.metadata, HealthConnectMapping.SLEEP, session.startTime, session.endTime, 0)
    )
    for (stage in session.stages) {
      samples += categorySample(session.metadata, HealthConnectMapping.SLEEP, stage.startTime, stage.endTime, fromSleepStage(stage.stage))
    }
    return samples
  }

  private fun toSleepStage(value: Int): Int = when (value) {
    0 -> SleepSessionRecord.STAGE_TYPE_AWAKE_IN_BED
    2 -> SleepSessionRecord.STAGE_TYPE_AWAKE
    3 -> SleepSessionRecord.STAGE_TYPE_LIGHT
    4 -> SleepSessionRecord.STAGE_TYPE_DEEP
    5 -> SleepSessionRecord.STAGE_TYPE_REM
    else -> SleepSessionRecord.STAGE_TYPE_SLEEPING
  }

  private fun fromSleepStage(stage: Int): Int = when (stage) {
    SleepSessionRecord.STAGE_TYPE_AWAKE_IN_BED -> 0
    SleepSessionRecord.STAGE_TYPE_AWAKE, SleepSessionRecord.STAGE_TYPE_OUT_OF_BED -> 2
    SleepSessionRecord.STAGE_TYPE_LIGHT -> 3
    SleepSessionRecord.STAGE_TYPE_DEEP -> 4
    SleepSessionRecord.STAGE_TYPE_REM -> 5
    else -> 1
  }

  private fun percentToCanonical(percentage: Percentage): Double = percentage.value / 100.0

  private fun percentFromCanonical(canonical: Double): Percentage =
    Percentage(if (canonical <= 1.0) canonical * 100.0 else canonical)

  private suspend fun <T : Record> readAll(
    recordType: KClass<T>,
    filter: TimeRangeFilter,
    ascending: Boolean,
    limit: Int
  ): List<T> {
    val out = mutableListOf<T>()
    var token: String? = null
    val pageSize = if (limit > 0) minOf(limit, 5000) else 1000
    do {
      val response = client().readRecords(
        ReadRecordsRequest(
          recordType = recordType,
          timeRangeFilter = filter,
          ascendingOrder = ascending,
          pageSize = pageSize,
          pageToken = token
        )
      )
      out += response.records
      token = response.pageToken
      if (limit > 0 && out.size >= limit) break
    } while (token != null)
    return if (limit > 0) out.take(limit) else out
  }

  private fun quantitySample(
    metadata: Metadata,
    type: String,
    start: Instant,
    end: Instant,
    value: Double,
    unit: String
  ): Map<String, Any?> = mapOf(
    "uuid" to metadata.id,
    "type" to type,
    "startDate" to iso(start),
    "endDate" to iso(end),
    "value" to value,
    "unit" to unit,
    "sourceName" to metadata.dataOrigin.packageName,
    "sourceId" to metadata.dataOrigin.packageName
  )

  private fun categorySample(
    metadata: Metadata,
    type: String,
    start: Instant,
    end: Instant,
    value: Int
  ): Map<String, Any?> = mapOf(
    "uuid" to metadata.id,
    "type" to type,
    "startDate" to iso(start),
    "endDate" to iso(end),
    "value" to value,
    "sourceName" to metadata.dataOrigin.packageName,
    "sourceId" to metadata.dataOrigin.packageName
  )

  private fun workoutSample(record: ExerciseSessionRecord, hkType: Int): Map<String, Any?> {
    val duration = Duration.between(record.startTime, record.endTime).seconds.toDouble()
    return mapOf(
      "uuid" to record.metadata.id,
      "type" to HealthConnectMapping.WORKOUT,
      "startDate" to iso(record.startTime),
      "endDate" to iso(record.endTime),
      "duration" to duration,
      "workoutActivityType" to hkType,
      "sourceName" to record.metadata.dataOrigin.packageName,
      "sourceId" to record.metadata.dataOrigin.packageName
    )
  }

  private fun correlation(
    metadata: Metadata,
    type: String,
    start: Instant,
    end: Instant,
    objects: List<Map<String, Any?>>
  ): Map<String, Any?> = mapOf(
    "uuid" to metadata.id,
    "type" to type,
    "startDate" to iso(start),
    "endDate" to iso(end),
    "objects" to objects,
    "sourceName" to metadata.dataOrigin.packageName,
    "sourceId" to metadata.dataOrigin.packageName
  )

  private fun client(): HealthConnectClient = HealthConnectClient.getOrCreate(context)

  private fun assertAvailable() {
    if (!isAvailable()) throw HealthKitUnavailableException()
  }

  private fun metadata(): Metadata = Metadata.manualEntry()

  private fun timeFilter(options: Map<String, Any?>): TimeRangeFilter {
    val from = (options["from"] as? String)?.let { parseInstant(it) }
    val to = (options["to"] as? String)?.let { parseInstant(it) }
    return when {
      from != null && to != null -> TimeRangeFilter.between(from, if (to.isAfter(from)) to else from.plusMillis(1))
      from != null -> TimeRangeFilter.after(from)
      to != null -> TimeRangeFilter.before(to)
      else -> TimeRangeFilter.after(Instant.EPOCH)
    }
  }

  private fun localTimeFilter(options: Map<String, Any?>): TimeRangeFilter {
    val zone = ZoneId.systemDefault()
    val from = (options["from"] as? String)?.let { parseInstant(it).atZone(zone).toLocalDateTime() }
    val to = (options["to"] as? String)?.let { parseInstant(it).atZone(zone).toLocalDateTime() }
    return when {
      from != null && to != null ->
        TimeRangeFilter.between(from, if (to.isAfter(from)) to else from.plusSeconds(1))
      from != null -> TimeRangeFilter.after(from)
      to != null -> TimeRangeFilter.before(to)
      else -> TimeRangeFilter.after(LocalDateTime.ofInstant(Instant.EPOCH, zone))
    }
  }

  private fun filterStart(options: Map<String, Any?>): Instant =
    (options["from"] as? String)?.let { parseInstant(it) } ?: Instant.EPOCH

  private fun filterEnd(options: Map<String, Any?>): Instant =
    (options["to"] as? String)?.let { parseInstant(it) } ?: Instant.now()

  private fun parseInstant(value: String): Instant = try {
    Instant.parse(value)
  } catch (_: Exception) {
    throw InvalidDateException(value)
  }

  private fun iso(instant: Instant): String = DateTimeFormatter.ISO_INSTANT.format(instant)

  private fun zoneOffset(instant: Instant): ZoneOffset =
    ZoneId.systemDefault().rules.getOffset(instant)

  private fun ensureRange(start: Instant, end: Instant): Pair<Instant, Instant> {
    if (!end.isAfter(start)) {
      return start to start.plusSeconds(1)
    }
    return start to end
  }

  private fun unmappedType(type: String): Nothing {
    if (type.startsWith("HK")) {
      throw HealthConnectUnsupportedException(type)
    }
    throw InvalidIdentifierException(type)
  }

  private fun requiredString(options: Map<String, Any?>, key: String): String =
    options[key] as? String ?: throw InvalidIdentifierException(key)

  private fun stringList(value: Any?): List<String> =
    (value as? List<*>)?.mapNotNull { it as? String } ?: emptyList()

  private fun intValue(value: Any?): Int = (value as? Number)?.toInt() ?: 0

  private fun <T> applyLimit(items: List<T>, limit: Int): List<T> =
    if (limit > 0) items.take(limit) else items

  private fun hasOption(bits: Int, option: Int): Boolean = bits and option != 0

  companion object {
    private const val OPT_AVG = 1
    private const val OPT_MIN = 2
    private const val OPT_MAX = 4
    private const val OPT_SUM = 8
    private const val OPT_RECENT = 32

    fun isAvailable(context: Context?): Boolean {
      if (context == null) return false
      return HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE
    }
  }
}
