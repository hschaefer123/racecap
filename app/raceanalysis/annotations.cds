using GT7Service as service from '../../srv/gt7-service';

// UI.Identification (Actions on Object Page) & Semantic Key
annotate service.Sessions with @(
    Common.SemanticKey: [ID], //field in bold, editing status displayed, when possible and it effects navigation
    UI.Identification : [
        {
            //Determining      : true,
            $Type            : 'UI.DataFieldForAction',
            Label            : '{i18n>generateFioriMetrics}',
            Action           : 'GT7Service.generateFioriMetrics',
            //Criticality      : #Positive,
            ![@UI.Importance]: #High
        }
    ]
);

// UI.PresentationVariant (ListReport DefaultSort)
annotate service.Sessions with @(
    UI.PresentationVariant : {
        SortOrder       : [ //Default sort order
            {
                Property    : createdAt,
                Descending  : true,
            },
        ],
        Visualizations  : ['@UI.LineItem'],
    },
);

// UI.LineItem (ListReport Columns)
annotate service.Sessions with @(UI.LineItem: [
    {
        $Type: 'UI.DataField',
        Label: 'Track',
        Value: trackUrl,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Session',
        Value: createdAt,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Car',
        Value: car.name,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Laps',
        Value: lapsInRace,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Best Lap',
        Value: bestLap,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Best Lap Time',
        Value: bestLapTime,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Max Speed',
        Value: calculatedMaxSpeed,
    },
    {
        $Type: 'UI.DataField',
        Label: 'Finished',
        Value: finished,
    }
]);

// UI.HeaderInfo (ObjectPage header info)
annotate service.Sessions with @(UI.HeaderInfo: {
    TypeName      : '{i18n>Session}',
    TypeNamePlural: '{i18n>Sessions}',
    Title         : {
        $Type: 'UI.DataField',
        Value: createdAt,
    },
    Description   : {
        $Type: 'UI.DataField',
        Value: car.name,
    },
    ImageUrl : trackUrl
    //TypeImageUrl  : 'sap-icon://performance',
});

// UI.HeaderFacets
annotate service.Sessions with @(UI.HeaderFacets: [{
    $Type : 'UI.CollectionFacet',
    ID    : 'CollectionFacet',
    Facets: [
        {
            //Search-Term: #HeaderFieldGroup
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#LapData',
        /*Label : '{i18n>LapData}',*/
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#RaceData',
        /*Label : '{i18n>RaceData}',*/
        }
    ],
}]);

// UI.FieldGroup
annotate service.Sessions with @(
    UI.FieldGroup #LapData : {Data: [
        {
            Label: '{i18n>lapsInRace}',
            Value: lapsInRace
        },
        {
            Label: '{i18n>bestLap}',
            Value: bestLap
        },
        {
            Label: '{i18n>bestLapTime}',
            Value: bestLapTime
        },
    ]},
    UI.FieldGroup #RaceData: {Data: [{
        Label: '{i18n>finished}',
        Value: finished
    }, ]}
);

/**
    Common.ValueList (ValueHelps)
 */
annotate service.Sessions with {
    car @Common.ValueList: {
        $Type         : 'Common.ValueListType',
        CollectionPath: 'Cars',
        Parameters    : [
            {
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: car_ID,
                ValueListProperty: 'ID',
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'name',
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'maker_ID',
            },
        ],
    }
};

annotate service.SessionMetrics with @(
    UI.Chart #chartSection                     : {
        $Type              : 'UI.ChartDefinitionType',
        ChartType          : #Line,
        Dimensions         : [
            currentLapTime,
            lapCount
        ],
        DimensionAttributes: [
            {
                $Type    : 'UI.ChartDimensionAttributeType',
                Dimension: currentLapTime,
                Role     : #Category,
            },
            {
                $Type    : 'UI.ChartDimensionAttributeType',
                Dimension: lapCount,
                Role     : #Series,
            },
        ],
        DynamicMeasures    : ['@Analytics.AggregatedProperty#value_average'],
        Title              : 'Speed analysis',
    }
);

annotate service.SessionMetrics with @(UI.Chart #chartSection1: {
    $Type              : 'UI.ChartDefinitionType',
    ChartType          : #Line,
    Dimensions         : [
        currentLapTime,
        lapCount
    ],
    DimensionAttributes: [
        {
            $Type    : 'UI.ChartDimensionAttributeType',
            Dimension: currentLapTime,
            Role     : #Category,
        },
        {
            $Type    : 'UI.ChartDimensionAttributeType',
            Dimension: lapCount,
            Role     : #Series,
        },
    ],
    DynamicMeasures    : ['@Analytics.AggregatedProperty#value_average'],
    Title              : 'Throttle metrics',
});

annotate service.SessionMetrics with @(UI.Chart #chartSection2: {
    $Type              : 'UI.ChartDefinitionType',
    ChartType          : #Line,
    Dimensions         : [
        currentLapTime,
        lapCount
    ],
    DimensionAttributes: [
        {
            $Type    : 'UI.ChartDimensionAttributeType',
            Dimension: currentLapTime,
            Role     : #Category,
        },
        {
            $Type    : 'UI.ChartDimensionAttributeType',
            Dimension: lapCount,
            Role     : #Series,
        },
    ],
    DynamicMeasures    : ['@Analytics.AggregatedProperty#value_average'],
    Title              : 'Brake analysis',
});

annotate service.SessionMetrics with @(
    UI.SelectionFields                        : [lapCount]
){
    @Common.ValueList: {
            Label         : 'Value with Value Help',
            CollectionPath: 'Laps',
            Parameters    : [
                {
                    $Type : 'Common.ValueListParameterIn',
                    LocalDataProperty : session_ID,
                    ValueListProperty : 'session_ID',
                },
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : lapCount,
                    ValueListProperty : 'lap',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'time'
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'best',
                },
            ]
          }
          @Common.ValueListWithFixedValues: true
    lapCount;
};
