using {gt7 as my} from '../db/schema';

type LapTime {
    lap  : Int16;
    time : Int32;
    best : Boolean;
}

@protocol: 'odata'
service GT7Service {
    @readonly
    entity Sessions                  as select from my.Sessions
        actions {
            @(
                //  Update the UI after action
                cds.odata.bindingparameter.name: '_it',
                Common.SideEffects             : {TargetEntities: [
                    '_it/Speed',
                    '_it/Throttle',
                    '_it/Brake'
                ]}
            )
            action   generateFioriMetrics();
            //action   playSimulation();
            function getLapTimes()    returns array of LapTime;
            function getCompareLaps() returns array of LapTime;
            function getLapSVG()      returns String;
        };

    @readonly
    @Capabilities.SearchRestrictions.Searchable: false
    entity SessionMetrics            as select from my.SessionMetrics;

    @readonly
    entity Laps                      as select from my.Laps;

    @readonly
    entity SimulatorInterfacePackets as select from my.SimulatorInterfacePackets;

    @readonly
    entity Cars                      as select from my.Cars;

    @readonly
    entity CarGroups                 as select from my.CarGroups;

    @readonly
    entity Countries                 as select from my.Countries;

    @readonly
    entity CourseBases               as select from my.CourseBases;

    @readonly
    entity Courses                   as select from my.Courses;

    @readonly
    entity EngineSwaps               as select from my.EngineSwaps;

    @readonly
    entity LotteryCars               as select from my.LotteryCars;

    @readonly
    entity Makers                    as select from my.Makers;

    @readonly
    entity StockPerformances         as select from my.StockPerformances;

    @readonly
    entity Trophies                  as select from my.Trophies;
}

annotate GT7Service.SessionMetrics with @Aggregation.ApplySupported: {
    AggregatableProperties: [{Property: value, }, ],
    GroupableProperties   : [
        currentLapTime,
        lapCount
    ],
};

annotate GT7Service.SessionMetrics with @Analytics.AggregatedProperty #value_average: {
    $Type               : 'Analytics.AggregatedPropertyType',
    Name                : 'value_average',
    AggregatableProperty: value,
    AggregationMethod   : 'average',
    ![@Common.Label]    : 'Value',
};
