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
    debug       : false,
    // ingenico settings ( setup your settings in environment.js)
    ingenico    : {
        username        : "",
        password        : "",
        apiKey          : "",
        baseUrl         : "https://uatmcm.roamdata.com/",
        clientVersion   : "0.1"
    },
    // global debug styles
    styles : {
        app             : 'color:#444;font-weight:600;font-family:\'operator mono ssm\', monospace;',
        providers       : 'color:forestgreen;margin-left:16px;font-family:\'operator mono ssms\', monospace;',
        pages           : 'color:indigo;font-family:\'operator mono ssms\', monospace;',
        components      : 'color:#004b8d;font-family:\'operator mono ssms\', monospace;',
        events          : 'color:steelblue;margin-left:24px;font-family:\'operator mono ssms\', monospace;',
        http            : 'color:dodgerblue;font-family:\'operator mono ssms\', monospace;',
        errorProvider   : 'color:teal;margin-left:24px;font-family:\'operator mono ssms\', monospace;',
        fatal           : 'color:firebrick;font-weight:600;margin-left:24px;font-family:\'operator mono ssms\', monospace;',
        platformReady   : 'color:#c00;font-weight:600;font-size:1.4em;font-family:\'operator mono ssms\', monospace;'
    }
}
