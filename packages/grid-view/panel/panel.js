// pixi-grid config
Editor.registerPanel( 'grid-view.panel', {
    is: 'grid-view',

    listeners: {
        'resize': '_onResize',
        'panel-show': '_onPanelShow',
    },

    ready: function () {
        // curveEditor
        this.$.curveEditor.setScaleH( [5,2,3,2], 1, 1000, 'frame' );
        // this.$.curveEditor.setScaleH( [5,2], 0.01, 1000 );
        this.$.curveEditor.setMappingH( 0, 100, 100 );

        this.$.curveEditor.setScaleV( [5,2], 0.01, 1000 );
        this.$.curveEditor.setMappingV( 100, -100, 200 );

        this.$.curveEditor.setAnchor( 0.0, 0.5 );

        // timeline
        this.$.timeline.setScaleH( [5,2,3,2], 1, 1000, 'frame' );
        this.$.timeline.setMappingH( 0, 100, 100 );

        this.$.timeline.setAnchor( 0.0, 0.0 );
    },

    _onResize: function ( event ) {
        this.$.curveEditor.resize();
        this.$.curveEditor.repaint();

        this.$.timeline.resize();
        this.$.timeline.repaint();
    },

    _onPanelShow: function ( event ) {
        this.$.curveEditor.resize();
        this.$.curveEditor.repaint();

        this.$.timeline.resize();
        this.$.timeline.repaint();
    },

    _onMouseWheel: function ( event ) {
        if (  Polymer.dom(event).localTarget === this.$.timeline ) {
            var newScale = Editor.Utils.smoothScale(this.$.timeline.xAxisScale, event.wheelDelta);
            this.$.timeline.xAxisScaleAt ( event.offsetX, newScale );
            this.$.timeline.repaint();

            newScale = Editor.Utils.smoothScale(this.$.curveEditor.xAxisScale, event.wheelDelta);
            this.$.curveEditor.xAxisScaleAt ( event.offsetX, newScale );
            this.$.curveEditor.repaint();
        }
        else {
            this.$.curveEditor.scaleAction(event);
            this.$.timeline.scaleAction(event);
        }
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

                this.$.curveEditor.pan( dx, dy );
                this.$.curveEditor.repaint();

                this.$.timeline.pan( dx, 0 );
                this.$.timeline.repaint();
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
