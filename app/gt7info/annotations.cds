using GT7Service as service from '../../srv/gt7-service';

annotate service.Cars with @(UI.LineItem #CarTable: [
    {
        $Type            : 'UI.DataField',
        Value            : maker.name,
        Label            : 'Maker',
        ![@UI.Importance]: #Medium,
    },
    {
        $Type            : 'UI.DataField',
        Value            : name,
        Label            : 'Car',
        ![@UI.Importance]: #High,
    },
]);

annotate service.Cars with @(UI.PresentationVariant #CarTable: {
    SortOrder     : [ //Default sort order
        {
            Property  : maker.name,
            Descending: false,
        },
        {
            Property  : name,
            Descending: false,
        },
    ],
    GroupBy       : [{$value: maker.name}],
    Visualizations: ['@UI.LineItem#CarTable'],
}, );
