(function () {

    Pace.once( 'hide', function () {
        EditorUI.removeLoadingMask();
    });

    EditorUI.addLoadingMask({
        background: '#333',
    });

    var mainDock = document.getElementById('mainDock');
    Editor.loadLayout( mainDock, function () {
    });

    // window.onbeforeunload = function ( event ) {
    //     var Remote = require('remote');
    //     var Dialog = Remote.require('dialog');
    //     var result = Dialog.showMessageBox( Remote.getCurrentWindow(), {
    //         type: "warning",
    //         buttons: ["Save","Cancel","Don't Save"],
    //         title: "Save Scene Confirm",
    //         message:  "Scene has changed, do you want to save it?",
    //         detail: "Your changes will be lost if you close this item without saving."
    //     } );

    //     switch ( result ) {
    //     // save
    //     case 0:
    //         return true;

    //     // cancel
    //     case 1:
    //         return false;

    //     // don't save
    //     case 2:
    //         return true;
    //     }
    // }.bind(this);
})();
