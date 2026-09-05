package expo.modules.healthkit

import androidx.health.connect.client.records.NutritionRecord
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.units.Energy
import androidx.health.connect.client.units.Mass
import java.time.Instant
import java.time.ZoneOffset

internal object HealthConnectNutrition {
  fun canonicalValue(record: NutritionRecord, identifier: String): Double? = when (identifier) {
    HealthConnectMapping.DIETARY_ENERGY -> record.energy?.inKilocalories
    "HKQuantityTypeIdentifierDietaryProtein" -> record.protein?.inKilograms
    "HKQuantityTypeIdentifierDietaryCarbohydrates" -> record.totalCarbohydrate?.inKilograms
    "HKQuantityTypeIdentifierDietaryFatTotal" -> record.totalFat?.inKilograms
    "HKQuantityTypeIdentifierDietaryFatSaturated" -> record.saturatedFat?.inKilograms
    "HKQuantityTypeIdentifierDietaryFatMonounsaturated" -> record.monounsaturatedFat?.inKilograms
    "HKQuantityTypeIdentifierDietaryFatPolyunsaturated" -> record.polyunsaturatedFat?.inKilograms
    "HKQuantityTypeIdentifierDietaryCholesterol" -> record.cholesterol?.inKilograms
    "HKQuantityTypeIdentifierDietarySodium" -> record.sodium?.inKilograms
    "HKQuantityTypeIdentifierDietarySugar" -> record.sugar?.inKilograms
    "HKQuantityTypeIdentifierDietaryFiber" -> record.dietaryFiber?.inKilograms
    "HKQuantityTypeIdentifierDietaryCaffeine" -> record.caffeine?.inKilograms
    "HKQuantityTypeIdentifierDietaryCalcium" -> record.calcium?.inKilograms
    "HKQuantityTypeIdentifierDietaryIron" -> record.iron?.inKilograms
    "HKQuantityTypeIdentifierDietaryPotassium" -> record.potassium?.inKilograms
    "HKQuantityTypeIdentifierDietaryVitaminA" -> record.vitaminA?.inKilograms
    "HKQuantityTypeIdentifierDietaryVitaminC" -> record.vitaminC?.inKilograms
    "HKQuantityTypeIdentifierDietaryVitaminD" -> record.vitaminD?.inKilograms
    "HKQuantityTypeIdentifierDietaryVitaminE" -> record.vitaminE?.inKilograms
    "HKQuantityTypeIdentifierDietaryVitaminK" -> record.vitaminK?.inKilograms
    "HKQuantityTypeIdentifierDietaryVitaminB6" -> record.vitaminB6?.inKilograms
    "HKQuantityTypeIdentifierDietaryVitaminB12" -> record.vitaminB12?.inKilograms
    "HKQuantityTypeIdentifierDietaryFolate" -> record.folate?.inKilograms
    "HKQuantityTypeIdentifierDietaryNiacin" -> record.niacin?.inKilograms
    "HKQuantityTypeIdentifierDietaryRiboflavin" -> record.riboflavin?.inKilograms
    "HKQuantityTypeIdentifierDietaryThiamin" -> record.thiamin?.inKilograms
    "HKQuantityTypeIdentifierDietaryMagnesium" -> record.magnesium?.inKilograms
    "HKQuantityTypeIdentifierDietaryManganese" -> record.manganese?.inKilograms
    "HKQuantityTypeIdentifierDietaryPhosphorus" -> record.phosphorus?.inKilograms
    "HKQuantityTypeIdentifierDietarySelenium" -> record.selenium?.inKilograms
    "HKQuantityTypeIdentifierDietaryZinc" -> record.zinc?.inKilograms
    "HKQuantityTypeIdentifierDietaryIodine" -> record.iodine?.inKilograms
    "HKQuantityTypeIdentifierDietaryChloride" -> record.chloride?.inKilograms
    "HKQuantityTypeIdentifierDietaryBiotin" -> record.biotin?.inKilograms
    "HKQuantityTypeIdentifierDietaryPantothenicAcid" -> record.pantothenicAcid?.inKilograms
    "HKQuantityTypeIdentifierDietaryMolybdenum" -> record.molybdenum?.inKilograms
    "HKQuantityTypeIdentifierDietaryCopper" -> record.copper?.inKilograms
    "HKQuantityTypeIdentifierDietaryChromium" -> record.chromium?.inKilograms
    else -> null
  }

  fun presentFields(record: NutritionRecord): List<Pair<String, Double>> {
    val identifiers = listOf(
      HealthConnectMapping.DIETARY_ENERGY,
      "HKQuantityTypeIdentifierDietaryProtein",
      "HKQuantityTypeIdentifierDietaryCarbohydrates",
      "HKQuantityTypeIdentifierDietaryFatTotal",
      "HKQuantityTypeIdentifierDietaryFatSaturated",
      "HKQuantityTypeIdentifierDietaryFatMonounsaturated",
      "HKQuantityTypeIdentifierDietaryFatPolyunsaturated",
      "HKQuantityTypeIdentifierDietaryCholesterol",
      "HKQuantityTypeIdentifierDietarySodium",
      "HKQuantityTypeIdentifierDietarySugar",
      "HKQuantityTypeIdentifierDietaryFiber",
      "HKQuantityTypeIdentifierDietaryCaffeine",
      "HKQuantityTypeIdentifierDietaryCalcium",
      "HKQuantityTypeIdentifierDietaryIron",
      "HKQuantityTypeIdentifierDietaryPotassium",
      "HKQuantityTypeIdentifierDietaryVitaminA",
      "HKQuantityTypeIdentifierDietaryVitaminC",
      "HKQuantityTypeIdentifierDietaryVitaminD",
      "HKQuantityTypeIdentifierDietaryVitaminE",
      "HKQuantityTypeIdentifierDietaryVitaminK",
      "HKQuantityTypeIdentifierDietaryVitaminB6",
      "HKQuantityTypeIdentifierDietaryVitaminB12",
      "HKQuantityTypeIdentifierDietaryFolate",
      "HKQuantityTypeIdentifierDietaryNiacin",
      "HKQuantityTypeIdentifierDietaryRiboflavin",
      "HKQuantityTypeIdentifierDietaryThiamin",
      "HKQuantityTypeIdentifierDietaryMagnesium",
      "HKQuantityTypeIdentifierDietaryManganese",
      "HKQuantityTypeIdentifierDietaryPhosphorus",
      "HKQuantityTypeIdentifierDietarySelenium",
      "HKQuantityTypeIdentifierDietaryZinc",
      "HKQuantityTypeIdentifierDietaryIodine",
      "HKQuantityTypeIdentifierDietaryChloride",
      "HKQuantityTypeIdentifierDietaryBiotin",
      "HKQuantityTypeIdentifierDietaryPantothenicAcid",
      "HKQuantityTypeIdentifierDietaryMolybdenum",
      "HKQuantityTypeIdentifierDietaryCopper",
      "HKQuantityTypeIdentifierDietaryChromium"
    )
    return identifiers.mapNotNull { id -> canonicalValue(record, id)?.let { id to it } }
  }

  fun build(
    start: Instant,
    end: Instant,
    startOffset: ZoneOffset?,
    endOffset: ZoneOffset?,
    metadata: Metadata,
    values: Map<String, Double>
  ): NutritionRecord {
    fun mass(id: String) = values[id]?.let { Mass.kilograms(it) }
    return NutritionRecord(
      startTime = start,
      startZoneOffset = startOffset,
      endTime = end,
      endZoneOffset = endOffset,
      energy = values[HealthConnectMapping.DIETARY_ENERGY]?.let { Energy.kilocalories(it) },
      protein = mass("HKQuantityTypeIdentifierDietaryProtein"),
      totalCarbohydrate = mass("HKQuantityTypeIdentifierDietaryCarbohydrates"),
      totalFat = mass("HKQuantityTypeIdentifierDietaryFatTotal"),
      saturatedFat = mass("HKQuantityTypeIdentifierDietaryFatSaturated"),
      monounsaturatedFat = mass("HKQuantityTypeIdentifierDietaryFatMonounsaturated"),
      polyunsaturatedFat = mass("HKQuantityTypeIdentifierDietaryFatPolyunsaturated"),
      cholesterol = mass("HKQuantityTypeIdentifierDietaryCholesterol"),
      sodium = mass("HKQuantityTypeIdentifierDietarySodium"),
      sugar = mass("HKQuantityTypeIdentifierDietarySugar"),
      dietaryFiber = mass("HKQuantityTypeIdentifierDietaryFiber"),
      caffeine = mass("HKQuantityTypeIdentifierDietaryCaffeine"),
      calcium = mass("HKQuantityTypeIdentifierDietaryCalcium"),
      iron = mass("HKQuantityTypeIdentifierDietaryIron"),
      potassium = mass("HKQuantityTypeIdentifierDietaryPotassium"),
      vitaminA = mass("HKQuantityTypeIdentifierDietaryVitaminA"),
      vitaminC = mass("HKQuantityTypeIdentifierDietaryVitaminC"),
      vitaminD = mass("HKQuantityTypeIdentifierDietaryVitaminD"),
      vitaminE = mass("HKQuantityTypeIdentifierDietaryVitaminE"),
      vitaminK = mass("HKQuantityTypeIdentifierDietaryVitaminK"),
      vitaminB6 = mass("HKQuantityTypeIdentifierDietaryVitaminB6"),
      vitaminB12 = mass("HKQuantityTypeIdentifierDietaryVitaminB12"),
      folate = mass("HKQuantityTypeIdentifierDietaryFolate"),
      niacin = mass("HKQuantityTypeIdentifierDietaryNiacin"),
      riboflavin = mass("HKQuantityTypeIdentifierDietaryRiboflavin"),
      thiamin = mass("HKQuantityTypeIdentifierDietaryThiamin"),
      magnesium = mass("HKQuantityTypeIdentifierDietaryMagnesium"),
      manganese = mass("HKQuantityTypeIdentifierDietaryManganese"),
      phosphorus = mass("HKQuantityTypeIdentifierDietaryPhosphorus"),
      selenium = mass("HKQuantityTypeIdentifierDietarySelenium"),
      zinc = mass("HKQuantityTypeIdentifierDietaryZinc"),
      iodine = mass("HKQuantityTypeIdentifierDietaryIodine"),
      chloride = mass("HKQuantityTypeIdentifierDietaryChloride"),
      biotin = mass("HKQuantityTypeIdentifierDietaryBiotin"),
      pantothenicAcid = mass("HKQuantityTypeIdentifierDietaryPantothenicAcid"),
      molybdenum = mass("HKQuantityTypeIdentifierDietaryMolybdenum"),
      copper = mass("HKQuantityTypeIdentifierDietaryCopper"),
      chromium = mass("HKQuantityTypeIdentifierDietaryChromium"),
      metadata = metadata
    )
  }
}
