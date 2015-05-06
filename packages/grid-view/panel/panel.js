// pixi-grid config
Editor.registerPanel( 'grid-view.panel', {
    is: 'grid-view',

    listeners: {
        'resize': '_onResize',
        'panel-show': '_onPanelShow',
    },

    ready: function () {
        this.$.pixiGrid.setScaleH( [5,2,3,2], 1, 1000, 'frame' );
        // this.$.pixiGrid.setScaleH( [5,2], 0.01, 1000 );
        this.$.pixiGrid.setMappingH( -100, 100, 200 );

        this.$.pixiGrid.setScaleV( [5,2], 0.01, 1000 );
        this.$.pixiGrid.setMappingV( 100, -100, 200 );

        this.$.pixiGrid.setAnchor( 0.0, 0.0 );
    },

    _onResize: function ( event ) {
        this.$.pixiGrid.resize();
        this.$.pixiGrid.repaint();
    },

    _onPanelShow: function ( event ) {
        this.$.pixiGrid.resize();
        this.$.pixiGrid.repaint();
    },

    _onMouseWheel: function ( event ) {
        this.$.pixiGrid.scaleAction(event);
    },

    _onMouseDown: function ( event ) {
        if ( event.which === 1 ) {
            event.stopPropagation();

            var mousemoveHandle = function(event) {
                event.stopPropagation();

                var dx = event.clientX - this._lastClientX;
                var dy = event.clientY - this._lastClientY;

                this._lastClientX = event.clientX;
                this._lastClientY = event.clientY;

                this.$.pixiGrid.pan( dx, dy );
                this.$.pixiGrid.repaint();
            }.bind(this);

            var mouseupHandle = function(event) {
                event.stopPropagation();

                document.removeEventListener('mousemove', mousemoveHandle);
                document.removeEventListener('mouseup', mouseupHandle);

                EditorUI.removeDragGhost();
                this.style.cursor = '';
            }.bind(this);

            //
            this._lastClientX = event.clientX;
            this._lastClientY = event.clientY;

            //
            EditorUI.addDragGhost('-webkit-grabbing');
            this.style.cursor = '-webkit-grabbing';
            document.addEventListener ( 'mousemove', mousemoveHandle );
            document.addEventListener ( 'mouseup', mouseupHandle );

            return;
        }
    },
});
