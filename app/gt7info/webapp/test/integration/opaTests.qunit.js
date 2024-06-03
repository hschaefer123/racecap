sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'gt7info/test/integration/FirstJourney',
		'gt7info/test/integration/pages/CarsMain'
    ],
    function(JourneyRunner, opaJourney, CarsMain) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('gt7info') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheCarsMain: CarsMain
                }
            },
            opaJourney.run
        );
    }
);