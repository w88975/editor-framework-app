Editor.registerPanel( 'animate-timeline.panel', {
    is: 'animate-timeline',

    properties: {
        frames: {
            type: Number,
            value: 0,
        }
    },

    listeners: {
        'resize': '_onResize',
        'frames': '_framesChanged',
    },

    ready: function () {

        this.lineSvg = SVG(this.$.lines);

        this.$.pixiGrid.setScaleH( [5,2,3,2], 1, 1000, 'frame' );
        this.$.pixiGrid.setMappingH( 0, 100, 100 );
        this.$.pixiGrid.setAnchor(0.0,0.0);

        this.$.dropSheep.setScaleH( [5,2,3,2], 1, 1000, 'frame' );
        this.$.dropSheep.setMappingH( 0, 100, 100 );
        this.$.dropSheep.setAnchor(0.0,0.0);

        this.tickWidth = 0;
        this.forward = false;
        this.rollBack = false;
        this.repaint();
    },

    _onResize: function ( event ) {
        this.tickWidth = this.$.layout.getBoundingClientRect().width;

        this.$.pixiGrid.resize();
        this.$.dropSheep.resize();

        this.repaint();
    },

    _onMouseWheel: function ( event ) {
        event.stopPropagation();

        var newScale = Editor.Utils.smoothScale(this.$.pixiGrid.xAxisScale, event.wheelDelta);
        this.$.pixiGrid.xAxisScaleAt ( event.offsetX, newScale );
        this.$.dropSheep.xAxisScaleAt ( event.offsetX, newScale );

        this.repaint();
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

                this.$.pixiGrid.pan( dx, 0 );
                this.$.dropSheep.pan( dx, 0 );
                this.repaint();
            }.bind(this);

            var mouseupHandle = function(event) {
                event.stopPropagation();

                document.removeEventListener('mousemove', mousemoveHandle);
                document.removeEventListener('mouseup', mouseupHandle);

                EditorUI.removeDragGhost();
                this.style.cursor = '';
            }.bind(this);

            this._lastClientX = event.clientX;
            this._lastClientY = event.clientY;

            EditorUI.addDragGhost('-webkit-grabbing');
            this.style.cursor = '-webkit-grabbing';
            document.addEventListener ( 'mousemove', mousemoveHandle );
            document.addEventListener ( 'mouseup', mouseupHandle );

            return;
        }
    },

    repaint: function () {
        window.requestAnimationFrame( function( event ) {
            this.$.pixiGrid.repaint();
            this.$.dropSheep.repaint();
            if (this.$.dropSheep.valueToPixelH(this.frames) < 0) {
                this.$.drag.style.display = 'none';
                this.$.mask.style.display = 'none';
            }
            else {
                this.$.drag.style.display = 'block';
                this.$.mask.style.display = 'block';
            }
            this.$.drag.style.left = this.$.dropSheep.valueToPixelH(this.frames);
            this.$.mask.style.width = this.drawMask();
            this.drawLines();
        }.bind(this));
    },

    drawTick: function () {
        this.tick.clear();
        this.linePool = [];
        this.textPool = [];
        var count = (this.$.timeline.getBoundingClientRect().width) / 50;
        var line = null;
        var text = null;
        for (var i = 0; i < count + 5; i ++) {
            if ((i) % 5 === 0 || i === 0) {
                line = this.tick.line( i * this.interval ,13, i * this.interval ,28)
                .stroke({
                    width: 1,
                    color: "#7D7D7D"
                });

                if (i === 0) {
                    text = this.tick.text( (0.00).toString() )
                    .move( i * this.interval + 2, 23)
                    .font({
                        size: 8,
                        fill: "#969696",
                    });
                }
                else {
                    text = this.tick.text( (this.unit * ((i) / 5)).toString() )
                    .move( i * this.interval + 2, 23)
                    .font({
                        size: 8,
                        fill: "#969696",
                    });
                }
            }
            else {
                if ( i % 2 !== 0) {
                    line = this.tick.line( i * this.interval, 13, i * this.interval, 22)
                    .stroke({
                        width: 1,
                        color: "#7D7D7D"
                    });
                }else {
                    line = this.tick.line( i * this.interval, 13, i * this.interval, 17)
                    .stroke({
                        width: 1,
                        color: "#7D7D7D"
                    });
                }
            }
            this.linePool.push(line);
            this.textPool.push(text);
        }
    },

    _framesChanged: function () {
        this.$.drag.style.left = this.$.dropSheep.valueToPixelH(this.frames);
        this.drawMask();
    },

    drawMask: function () {
        this.$.mask.style.width = this.$.drag.getBoundingClientRect().left - this.$.layout.getBoundingClientRect().left;
    },

    // TODO: 务必使用canvas绘制
    drawLines: function () {
        this.$.ul.innerHTML = '';
        var width = this.$.lines.getBoundingClientRect().width;
        var height = this.$.lines.getBoundingClientRect().height;
        for (var i = 0; i < (height/30) + 2; i++) {
            var li = document.createElement('li');
            li.className = 'item';
            li.style.width = "100%";
            li.style.height = "30px";
            if ( i%2 === 0 ) {
                li.style.background = 'black';
            }
            else {
                li.style.background = 'gray';
            }
            this.$.ul.appendChild(li);
        }
    },

    _drag: function (event) {
        EditorUI.addDragGhost("col-resize");

        var time = setInterval(function () {
            if (this.forward) {
                this.$.pixiGrid.pan( -3, 0 );
                this.$.dropSheep.pan( -3, 0 );
                this.frames = this.$.dropSheep.pixelToValueH(this.tickWidth - 20);
                tipElement.innerHTML = this.frames;
                this.repaint();
            }
            if (this.rollBack) {
                this.$.pixiGrid.pan( + 3, 0 );
                this.$.dropSheep.pan( + 3, 0 );
                this.frames = this.$.dropSheep.pixelToValueH(1);
                tipElement.innerHTML = this.frames;
                this.repaint();
            }
        }.bind(this),2);

        var left = this.$.drag.getBoundingClientRect().left - this.$.layout.getBoundingClientRect().left;
        var parentLeft = this.$.layout.getBoundingClientRect().left;

        var tipElement = this.$.tip.cloneNode(true);

        document.body.appendChild(tipElement);

        var mousemoveHandle =  function (event) {
            var dx = event.clientX - this._lastClientX;
            if ( (left + dx) <= 0) {
                this.$.drag.style.left = 0;
                this.frames = 0;

                this.drawMask();
                tipElement.innerHTML = this.frames;
                this.forward = false;
                // this.rollBack = true;
                return;
            }
            if ((left + dx) >= (this.tickWidth - 50)) {
                this.$.drag.style.left = this.tickWidth - 50;
                this.frames = this.$.dropSheep.pixelToValueH(this.tickWidth - 20);
                this.drawMask();
                tipElement.innerHTML = this.frames;
                this.forward = true;
                this.rollBack = false;
                return;
            }
            this.forward = false;
            this.rollBack = false;
            this.$.drag.style.left = left + dx;
            this.frames = this.$.dropSheep.pixelToValueH(left + dx);
            this.drawMask();

            tipElement.style.display = 'block';
            tipElement.style.left = event.x + 20;
            tipElement.style.top = event.y - 20;
            tipElement.innerHTML = this.frames;
        }.bind(this);

        var mouseupHandle = function (event) {

            document.removeEventListener('mousemove', mousemoveHandle);
            document.removeEventListener('mouseup', mouseupHandle);
            tipElement.style.display = 'none';
            document.body.removeChild(tipElement);
            this.forward = false;
            this.rollBack = false;
            clearInterval(time);
            EditorUI.removeDragGhost();
        }.bind(this);

        this._lastClientX = event.clientX;

        document.addEventListener ( 'mousemove', mousemoveHandle );
        document.addEventListener ( 'mouseup', mouseupHandle );
    },
});
