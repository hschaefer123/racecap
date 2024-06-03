namespace gt7;

using {cuid} from '@sap/cds/common';
//const { SessionMetric } = require ('../@cds-models/GT7Service')

type Vector3 {
    x : Decimal;
    y : Decimal;
    z : Decimal;
}

type Vector3Rotation {
    pitch : Decimal;
    yaw   : Decimal;
    roll  : Decimal;
}

type Wheel {
    fl : Decimal;
    fr : Decimal;
    rl : Decimal;
    rr : Decimal;
}

entity Sessions : cuid {
    //createdAt : Timestamp @cds.on.insert: $now;
    createdAt          : Timestamp;
    car                : Association to Cars;
    lapsInRace         : Int16;
    bestLap            : Int16;
    bestLapTime        : Int32;
    finished           : Boolean default false;
    timeOfDay          : Int32;
    calculatedMaxSpeed : Int16;
    bodyHeight         : Decimal;
    virtual trackUrl   : String  @Core.IsURL  @Core.MediaType: 'image/svg+xml';
    Laps               : Association to many Laps
                             on Laps.session_ID = ID;
    Packets            : Composition of many SimulatorInterfacePackets
                             on Packets.session = $self;
    Measures           : Composition of many SessionMetrics
                             on Measures.session = $self;
    Speed              : Composition of many SessionMetrics
                             on  Speed.session = $self
                             and Speed.measure = 1;
    Brake              : Composition of many SessionMetrics
                             on  Brake.session = $self
                             and Brake.measure = 2;
    Throttle           : Composition of many SessionMetrics
                             on  Throttle.session = $self
                             and Throttle.measure = 3;
}

entity Laps {
    key session_ID : Sessions:ID;
    key lap        : Int16;
        time       : Int32;
        best       : Boolean
}

entity SessionMetrics {
    key session        : Association to Sessions @UI.HiddenFilter;
    key packetId       : Int32;
    key measure        : Integer enum {
            metersPerSecond = 1;
            brake           = 2;
            throttle        = 3;
        };
        value          : Int32;

        @description: 'Current lap count'
        lapCount       : Int16                   @title: 'Lap';
        currentLapTime : Int32                   @title: 'Time';
}

entity SimulatorInterfacePackets {
        @description: 'Id of the session all packets belong to'
    key session                        : Association to Sessions;

        @description: 'Id of the packet for proper ordering'
    key packetId                       : Int32;

        @description: 'Internal code that identifies the car'
        car                            : Association to Cars;

        //magic                            : Int32;
        // 0x30533647 = G6S0 - GT6
        // 0x47375330 = 0S7G - GTSport/GT7
        @description: 'Position on the track. Track units are in meters'
        position                       : Vector3;

        @description: 'Velocity in track units (which are meters) for each axis'
        velocity                       : Vector3;

        @description: 'Rotation (Pitch/Yaw/Roll) from -1 to 1'
        rotation                       : Vector3Rotation;

        @description: 'Orientation to North. 1.0 is north, 0.0 is south'
        relativeOrientationToNorth     : Decimal;

        @description: 'How fast the car turns around axes. (In radians/second, -1 to 1)'
        angularVelocity                : Vector3;

        @description: 'Body height'
        bodyHeight                     : Decimal;

        @description: 'Engine revolutions per minute'
        engineRPM                      : Decimal;

        @description: 'Gas level for the current car (in liters, from 0 to GasCapacity'
        //Note: This may change from 0 when regenerative braking with electric cars, check accordingly with <see cref="GasCapacity"/>. </para>
        gasLevel                       : Decimal;

        @description: 'Max gas capacity for the current car'
        // Will be 100 for most cars, 5 for karts, 0 for electric cars
        gasCapacity                    : Decimal;

        @description: 'Current speed in meters per second. <see cref="MetersPerSecond * 3.6"/> to get it in KPH'
        metersPerSecond                : Decimal;

        @description: 'Current distance on track in meter (metersPerSecond / lapTick)'
        distance                       : Decimal; // calculated from metersPerSecond + lapTick

        @description: 'Value below 1.0 is below 0 ingame, so 2.0 = 1 x 100kPa'
        turboBoost                     : Decimal;

        @description: 'Oil Pressure (in Bars)'
        oilPressure                    : Decimal;

        @description: 'Games will always send 85 (in °C)'
        waterTemperature               : Decimal;

        @description: 'Games will always send 110 (in °C)'
        oilTemperature                 : Decimal;

        @description: 'Current lap count'
        lapCount                       : Int16;

        @description: 'Laps to finish'
        lapsInRace                     : Int16;

        @description: 'Current Lap Time'
        // Defaults to -1 millisecond when not set (computed because not part of SIP)
        currentLapTime                 : Int32; // calculated from packetId delta
        currentLapTime2                : Int32; // calculated from timeOfDayProgression

        @description: 'Best Lap Time'
        // Defaults to -1 millisecond when not set
        bestLapTime                    : Int32;

        @description: 'Last Lap Time'
        // Defaults to -1 millisecond when not set
        lastLapTime                    : Int32;

        @description: 'Current time of day on the track'
        timeOfDayProgression           : Int32;

        @description: 'Position of the car before the race has started'
        // Will be -1 once the race is started
        preRaceStartPositionOrQualiPos : Int16;

        @description: 'Number of cars in the race before the race has started'
        // Will be -1 once the race is started
        numCarsAtPreRace               : Int16;

        @description: 'Minimum RPM to which the rev limiter shows an alert'
        minAlertRPM                    : Int16;

        @description: 'Maximum RPM to the rev limiter alert'
        maxAlertRPM                    : Int16;

        @description: 'Possible max speed achievable using the current transmission settings'
        // Will change depending on transmission settings
        calculatedMaxSpeed             : Int16;

        @description: 'Packet flags (see Flags.ts)'
        flags                          : Int16;

        @description: 'Current Gear for the car'
        // This value will never be more than 15 (4 bits)
        currentGear                    : Int16;

        @description: '(Assist) Suggested Gear to downshift to'
        // This value will never be more than 15 (4 bits),
        // All bits on (aka 15) implies there is no current suggested gear
        suggestedGear                  : Int16;

        @description: 'Throttle (0-255)'
        throttle                       : Int16;

        @description: 'Brake Pedal (0-255)'
        brake                          : Int16;

        @description: ''
        roadPlane                      : Vector3;

        @description: ''
        roadPlaneDistance              : Decimal;

        @description: 'Tire - Tire Radius (in Meters)'
        tireRadius                     : Wheel;

        @description: 'Tire - Suspension Height'
        tireSuspensionHeight           : Wheel;

        @description: 'Tire - Surface Temperature (in °C)'
        tireSurfaceTemperature         : Wheel;

        @description: 'Wheel - Revolutions Per Second (in Radians)'
        wheelRevPerSecond              : Wheel;

        @description: '0.0 to 1.0'
        clutchPedal                    : Decimal;

        @description: '0.0 to 1.0'
        clutchEngagement               : Decimal;

        @description: 'Basically same as engine rpm when in gear and the clutch pedal is not depressed'
        rpmFromClutchToGearbox         : Decimal;

        @description: 'Top Speed (as a Gear Ratio value)'
        transmissionTopSpeed           : Decimal;
/*
@description: 'Gear ratios for the car. Up to 7'
gearRatios: [
  2.8460001945495605,
  2.2350001335144043,
  1.7650001049041748,
  1.474000096321106,
  1.218000054359436,
  1.027999997138977,
  0,
  0
],
*/
}

entity Cars {
    key ID    : Integer;
        name  : String(200);
        maker : Association to Makers;
}

entity CarGroups {
    key ID    : Integer;
        group : String(200);
}

entity Countries {
    key ID   : Integer;
        name : String(200);
        code : String(3);
}


entity CourseBases {
    key ID       : Integer;
        name     : String(200);
        logoName : String(200);
}

entity Courses {
    key ID              : Integer;
        name            : String(200);
        base            : Association to CourseBases;
        country         : Association to Countries;
        category        : String(200);
        length          : Integer;
        longestStraight : Integer;
        elevationDiff   : Decimal;
        altitude        : Decimal;
        minTimeH        : Integer;
        minTimeM        : Integer;
        minTimeS        : Integer;
        maxTimeH        : Integer;
        maxTimeM        : Integer;
        maxTimeS        : Integer;
        layoutNumber    : Integer;
        isReverse       : Boolean;
        pitLaneDelta    : Decimal;
        isOval          : Boolean;
        numCorners      : Integer;
        noRain          : Boolean;
}

entity EngineSwaps {
    newCar      : Integer;
    originalCar : Integer;
    engineName  : String(200);
}

entity LotteryCars {
    category : String(200);
    carID    : Integer;
}

entity Makers {
    key ID      : Integer;
        name    : String(200);
        country : Association to Countries;
}

entity StockPerformances {
    key ID   : Integer;
    key pp   : Decimal;
    key tyre : String(2);
}

entity Trophies {
    name : String(200);
    car  : Association to Cars;
}
