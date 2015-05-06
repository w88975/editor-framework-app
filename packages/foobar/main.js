module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'foobar:open': function () {
        Editor.Panel.open( 'foobar.panel' );
    },

    'foobar:test': function () {
        function hello() { Editor.error( new Error('fuck me') ); }
        // Editor.error( new Error('hello') );

        hello();
    },
};
