/*
* THIS FILE CONTAINS PRODUCTION VALUES!!!
* To work with test values create a file called environments.js in this
* same folder and overwrite the settings of the object below either
* by key or replace the entire object. If you are replacing the entire object
* make sure to check regularly in order to avoid any errors due to a missing
* value.
*/
var appSettings = {
	// Controls output of console logs when debugging
    debug   	: false,
    // ingenico settings
    ingenico 	: {
    	username 		: "logicstudiotest1",
    	password 		: "logicstudio",
    	apiKey 			: "CAT6-64a80ac1-0ff3-4d32-ac92-5558a6870a88",
    	baseUrl 		: "https://uatmcm.roamdata.com/",
    	clientVersion 	: "0.1"
    },
    // global debug styles
    styles : {
        app             : 'color:#444;font-weight:600',
        providers       : 'color:forestgreen;margin-left:16px;',
        pages           : 'color:indigo;',
        components      : 'color:#004b8d;',
        events          : 'color:steelblue;margin-left:24px;',
        http            : 'color:dodgerblue;',
        errorProvider   : 'color:teal;margin-left:24px;',
        fatal           : 'color:firebrick;font-weight:600;margin-left:24px;',
        platformReady   : 'color:#c00;font-weight:600;font-size:1.4em;'
    }
}