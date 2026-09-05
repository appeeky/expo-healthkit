package expo.modules.healthkit

import androidx.health.connect.client.records.ExerciseSessionRecord

internal object HealthConnectWorkouts {
  fun toHealthConnect(hkActivityType: Int): Int = when (hkActivityType) {
    1 -> ExerciseSessionRecord.EXERCISE_TYPE_FOOTBALL_AMERICAN
    2 -> ExerciseSessionRecord.EXERCISE_TYPE_OTHER_WORKOUT
    3 -> ExerciseSessionRecord.EXERCISE_TYPE_FOOTBALL_AUSTRALIAN
    4 -> ExerciseSessionRecord.EXERCISE_TYPE_BADMINTON
    5 -> ExerciseSessionRecord.EXERCISE_TYPE_BASEBALL
    6 -> ExerciseSessionRecord.EXERCISE_TYPE_BASKETBALL
    8 -> ExerciseSessionRecord.EXERCISE_TYPE_BOXING
    9 -> ExerciseSessionRecord.EXERCISE_TYPE_ROCK_CLIMBING
    10 -> ExerciseSessionRecord.EXERCISE_TYPE_CRICKET
    13 -> ExerciseSessionRecord.EXERCISE_TYPE_BIKING
    14, 15, 77, 78 -> ExerciseSessionRecord.EXERCISE_TYPE_DANCING
    16 -> ExerciseSessionRecord.EXERCISE_TYPE_ELLIPTICAL
    18 -> ExerciseSessionRecord.EXERCISE_TYPE_FENCING
    20, 50 -> ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING
    21 -> ExerciseSessionRecord.EXERCISE_TYPE_GOLF
    22 -> ExerciseSessionRecord.EXERCISE_TYPE_GYMNASTICS
    23 -> ExerciseSessionRecord.EXERCISE_TYPE_HANDBALL
    24 -> ExerciseSessionRecord.EXERCISE_TYPE_HIKING
    25 -> ExerciseSessionRecord.EXERCISE_TYPE_ICE_HOCKEY
    28 -> ExerciseSessionRecord.EXERCISE_TYPE_MARTIAL_ARTS
    31 -> ExerciseSessionRecord.EXERCISE_TYPE_PADDLING
    34 -> ExerciseSessionRecord.EXERCISE_TYPE_RACQUETBALL
    35 -> ExerciseSessionRecord.EXERCISE_TYPE_ROWING
    36 -> ExerciseSessionRecord.EXERCISE_TYPE_RUGBY
    37 -> ExerciseSessionRecord.EXERCISE_TYPE_RUNNING
    38 -> ExerciseSessionRecord.EXERCISE_TYPE_SAILING
    39 -> ExerciseSessionRecord.EXERCISE_TYPE_SKATING
    40, 60, 61 -> ExerciseSessionRecord.EXERCISE_TYPE_SKIING
    41 -> ExerciseSessionRecord.EXERCISE_TYPE_SOCCER
    42 -> ExerciseSessionRecord.EXERCISE_TYPE_SOFTBALL
    43 -> ExerciseSessionRecord.EXERCISE_TYPE_SQUASH
    44, 68 -> ExerciseSessionRecord.EXERCISE_TYPE_STAIR_CLIMBING
    45 -> ExerciseSessionRecord.EXERCISE_TYPE_SURFING
    46 -> ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_POOL
    47 -> ExerciseSessionRecord.EXERCISE_TYPE_TABLE_TENNIS
    48 -> ExerciseSessionRecord.EXERCISE_TYPE_TENNIS
    51 -> ExerciseSessionRecord.EXERCISE_TYPE_VOLLEYBALL
    52 -> ExerciseSessionRecord.EXERCISE_TYPE_WALKING
    54 -> ExerciseSessionRecord.EXERCISE_TYPE_WATER_POLO
    57 -> ExerciseSessionRecord.EXERCISE_TYPE_YOGA
    63 -> ExerciseSessionRecord.EXERCISE_TYPE_HIGH_INTENSITY_INTERVAL_TRAINING
    64 -> ExerciseSessionRecord.EXERCISE_TYPE_CALISTHENICS
    66 -> ExerciseSessionRecord.EXERCISE_TYPE_PILATES
    67 -> ExerciseSessionRecord.EXERCISE_TYPE_SNOWBOARDING
    70, 71 -> ExerciseSessionRecord.EXERCISE_TYPE_WHEELCHAIR
    74 -> ExerciseSessionRecord.EXERCISE_TYPE_BIKING
    75 -> ExerciseSessionRecord.EXERCISE_TYPE_FRISBEE_DISC
    else -> ExerciseSessionRecord.EXERCISE_TYPE_OTHER_WORKOUT
  }

  fun toHealthKit(exerciseType: Int): Int = when (exerciseType) {
    ExerciseSessionRecord.EXERCISE_TYPE_FOOTBALL_AMERICAN -> 1
    ExerciseSessionRecord.EXERCISE_TYPE_FOOTBALL_AUSTRALIAN -> 3
    ExerciseSessionRecord.EXERCISE_TYPE_BADMINTON -> 4
    ExerciseSessionRecord.EXERCISE_TYPE_BASEBALL -> 5
    ExerciseSessionRecord.EXERCISE_TYPE_BASKETBALL -> 6
    ExerciseSessionRecord.EXERCISE_TYPE_BOXING -> 8
    ExerciseSessionRecord.EXERCISE_TYPE_ROCK_CLIMBING -> 9
    ExerciseSessionRecord.EXERCISE_TYPE_CRICKET -> 10
    ExerciseSessionRecord.EXERCISE_TYPE_BIKING, ExerciseSessionRecord.EXERCISE_TYPE_BIKING_STATIONARY -> 13
    ExerciseSessionRecord.EXERCISE_TYPE_DANCING -> 14
    ExerciseSessionRecord.EXERCISE_TYPE_ELLIPTICAL -> 16
    ExerciseSessionRecord.EXERCISE_TYPE_FENCING -> 18
    ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING, ExerciseSessionRecord.EXERCISE_TYPE_WEIGHTLIFTING -> 50
    ExerciseSessionRecord.EXERCISE_TYPE_GOLF -> 21
    ExerciseSessionRecord.EXERCISE_TYPE_GYMNASTICS -> 22
    ExerciseSessionRecord.EXERCISE_TYPE_HANDBALL -> 23
    ExerciseSessionRecord.EXERCISE_TYPE_HIKING -> 24
    ExerciseSessionRecord.EXERCISE_TYPE_ICE_HOCKEY -> 25
    ExerciseSessionRecord.EXERCISE_TYPE_MARTIAL_ARTS -> 28
    ExerciseSessionRecord.EXERCISE_TYPE_PADDLING -> 31
    ExerciseSessionRecord.EXERCISE_TYPE_RACQUETBALL -> 34
    ExerciseSessionRecord.EXERCISE_TYPE_ROWING, ExerciseSessionRecord.EXERCISE_TYPE_ROWING_MACHINE -> 35
    ExerciseSessionRecord.EXERCISE_TYPE_RUGBY -> 36
    ExerciseSessionRecord.EXERCISE_TYPE_RUNNING, ExerciseSessionRecord.EXERCISE_TYPE_RUNNING_TREADMILL -> 37
    ExerciseSessionRecord.EXERCISE_TYPE_SAILING -> 38
    ExerciseSessionRecord.EXERCISE_TYPE_SKATING -> 39
    ExerciseSessionRecord.EXERCISE_TYPE_SKIING -> 40
    ExerciseSessionRecord.EXERCISE_TYPE_SOCCER -> 41
    ExerciseSessionRecord.EXERCISE_TYPE_SOFTBALL -> 42
    ExerciseSessionRecord.EXERCISE_TYPE_SQUASH -> 43
    ExerciseSessionRecord.EXERCISE_TYPE_STAIR_CLIMBING, ExerciseSessionRecord.EXERCISE_TYPE_STAIR_CLIMBING_MACHINE -> 44
    ExerciseSessionRecord.EXERCISE_TYPE_SURFING -> 45
    ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_POOL, ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_OPEN_WATER -> 46
    ExerciseSessionRecord.EXERCISE_TYPE_TABLE_TENNIS -> 47
    ExerciseSessionRecord.EXERCISE_TYPE_TENNIS -> 48
    ExerciseSessionRecord.EXERCISE_TYPE_VOLLEYBALL -> 51
    ExerciseSessionRecord.EXERCISE_TYPE_WALKING -> 52
    ExerciseSessionRecord.EXERCISE_TYPE_WATER_POLO -> 54
    ExerciseSessionRecord.EXERCISE_TYPE_YOGA -> 57
    ExerciseSessionRecord.EXERCISE_TYPE_HIGH_INTENSITY_INTERVAL_TRAINING -> 63
    ExerciseSessionRecord.EXERCISE_TYPE_CALISTHENICS -> 64
    ExerciseSessionRecord.EXERCISE_TYPE_PILATES -> 66
    ExerciseSessionRecord.EXERCISE_TYPE_SNOWBOARDING -> 67
    ExerciseSessionRecord.EXERCISE_TYPE_WHEELCHAIR -> 70
    ExerciseSessionRecord.EXERCISE_TYPE_FRISBEE_DISC -> 75
    else -> 0
  }
}
