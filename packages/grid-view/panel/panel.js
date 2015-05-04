// pixi-grid config
Editor.registerPanel( 'grid-view.panel', {
    is: 'grid-view',

    listeners: {
        'resize': '_onResize',
        'panel-show': '_onPanelShow',
    },

    _onResize: function ( event ) {
        this.$.pixiGrid.autoResize();
    },

    _onPanelShow: function ( event ) {
        this.$.pixiGrid.autoResize();
    },
});
