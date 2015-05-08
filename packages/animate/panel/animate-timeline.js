Editor.registerPanel( 'animate-timeline.panel', {
    is: 'animate-timeline',

    properties: {
        frames: {
            type: Number,
            value: 200,
            observer: '_framesChanged',
        },
        actions: {
            type: Object,
            value: []
        }
    },

    listeners: {
        'resize': '_onResize',
    },

    ready: function () {

        this.xscrollTop = 0;
        this.lineSvg = SVG(this.$.lines);

        this.$.timeLine.setScaleH( [5,2,3,2], 1, 1000, 'frame' );
        this.$.timeLine.setMappingH( 0, 100, 100 );
        this.$.timeLine.setAnchor(0.0,0.0);

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

        this.$.actionItem.style.height = this.$.actionTree.getBoundingClientRect().height - this.$.toolbar.getBoundingClientRect().height;

        this.$.timeLine.resize();

        this.$.dropSheep.resize();

        this.repaint();
    },

    _framesChanged: function () {
        if ( this.$.dropSheep.valueToPixelH) {
            this.integerFrame(this.valueToPixelH(this.frames));
        }
    },

    _onMouseWheel: function ( event ) {
        event.stopPropagation();

        var newScale = Editor.Utils.smoothScale(this.$.timeLine.xAxisScale, event.wheelDelta);

        if (newScale <= 1) {
            newScale = 1;
        }

        this.$.timeLine.xAxisScaleAt ( event.offsetX, newScale );
        this.$.dropSheep.xAxisScaleAt ( event.offsetX, newScale );

        this.repaint();
    },

    _onMouseDown: function ( event ) {
        event.stopPropagation();

        if ( event.which === 1 ) {
            event.stopPropagation();

            var mousemoveHandle = function(event) {
                event.stopPropagation();

                var dx = event.clientX - this._lastClientX;
                var dy = event.clientY - this._lastClientY;

                this._lastClientX = event.clientX;
                this._lastClientY = event.clientY;

                if (this.$.dropSheep.xAxisOffset + dx >= 0) {

                    this.$.dropSheep.xAxisOffset = 0;
                    this.$.timeLine.xAxisOffset = 0;
                    this.repaint();

                    return;
                }
                this.$.timeLine.pan( dx, 0 );
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
            this.$.timeLine.repaint();
            this.$.dropSheep.repaint();

            if (this.valueToPixelH(this.frames) < 0) {
                this.$.drag.style.display = 'none';
                this.$.mousecube.style.display = 'none';
                this.$.mask.style.display = 'none';
            }
            else {
                this.$.drag.style.display = 'block';
                this.$.mousecube.style.display = 'block';
                this.$.mask.style.display = 'block';
            }

            this.$.drag.style.left = this.valueToPixelH(this.frames);
            this.$.mousecube.style.left = this.valueToPixelH(this.frames);
            this.$.mask.style.width = this.drawMask();
            this.repaintActions();
        }.bind(this));
    },

    drawMask: function () {
        this.$.mask.style.width = this.$.drag.getBoundingClientRect().left - this.$.layout.getBoundingClientRect().left;
    },

    valueToPixelH: function (value) {
        return this.$.dropSheep.valueToPixelH(value);
    },

    pixelToValueH: function (value) {
        return this.$.dropSheep.pixelToValueH(value);
    },

    integerFrame: function (offsetX) {
        var nextFrames = this.pixelToValueH(offsetX);
        var integerPixel = this.valueToPixelH(Math.round(nextFrames));
        this.$.drag.style.left = integerPixel;
        this.$.mousecube.style.left = integerPixel;
        this.frames = Math.round(nextFrames);
        this.drawMask();
        return this.frames;
    },

    _click: function (event) {
        event.stopPropagation();

        this.integerFrame(event.offsetX);
        // this.repaint();
    },

    _drag: function (event) {
        EditorUI.addDragGhost("col-resize");

        var time = setInterval(function () {
            if (this.forward) {
                this.$.timeLine.pan( -this.step, 0 );
                this.$.dropSheep.pan( -this.step, 0 );
                this.frames += 3;
                tipElement.innerHTML = this.frames;
                this.repaint();
            }
            if (this.rollBack) {
                this.$.timeLine.pan( + 3, 0 );
                this.$.dropSheep.pan( + 3, 0 );
                this.frames = this.pixelToValueH(1);
                tipElement.innerHTML = this.frames;
                this.repaint();
            }
        }.bind(this), 2 * this.$.dropSheep.xAxisScale);

        var left = this.$.drag.getBoundingClientRect().left - this.$.layout.getBoundingClientRect().left;
        var parentLeft = this.$.layout.getBoundingClientRect().left;

        var tipElement = this.$.tip.cloneNode(true);

        document.body.appendChild(tipElement);

        var mousemoveHandle =  function (event) {
            var dx = event.clientX - this._lastClientX;
            if ( (left + dx) <= 0) {
                this.$.drag.style.left = 0;
                this.$.mousecube.style.left = 0;
                this.frames = 0;

                this.drawMask();
                tipElement.innerHTML = this.frames;
                this.forward = false;
                // this.rollBack = true;
                return;
            }
            if ((left + dx) >= (this.tickWidth - 50)) {

                this.integerFrame(this.tickWidth - 50);
                tipElement.innerHTML = this.frames;
                this.step = (this.valueToPixelH(1) - this.valueToPixelH(0)) * 3;
                this.forward = true;
                this.rollBack = false;
                return;
            }
            this.forward = false;
            this.rollBack = false;

            this.integerFrame(left + dx);

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

    _scroll: function (event) {
        event.stopPropagation();

        this.xscrollTop = this.$.actionItem.scrollTop;
        this.repositionBackground(this.xscrollTop);

        this.repaintActions(this.xscrollTop);
    },

    repositionBackground: function (top) {
        this.$.action.style.backgroundPosition = '0 ' + -top + 'px';
        this.$.lineBg.style.backgroundPosition = '0 ' + -top + 'px';
    },

    'timeline:add-item': function (detail) {
        var lineIndex = this.actions.length;

        var name = detail;

        this.createActionNode(lineIndex,name,null);

        this.xscrollTop = this.$.actionItem.scrollHeight - this.$.actionItem.getBoundingClientRect().height;
        this.$.actionItem.scrollTop = this.xscrollTop;
        this.repositionBackground(this.xscrollTop);
    },

    _addItem: function (event) {
        var rect  = event.target.getBoundingClientRect();

        Editor.Menu.popup( rect.left + 5, rect.bottom + 5, [
            { label: 'type1', message: 'timeline:add-item', params: ['type1'] },
            { label: 'type2', message: 'timeline:add-item', params: ['type2'] },
            { label: 'type3', message: 'timeline:add-item', params: ['type3'] },
            { label: 'type4', message: 'timeline:add-item', params: ['type4'] },
        ]);
    },

    createActionNode: function (lineIndex,name,type) {

        //检查当前frame是否有节点
        // for (var item in this.actions) {
        //     if (this.actions[item].frame === this.frames && this.actions[item].lineIndex === lineIndex ) {
        //         return;
        //     }
        // }

        var offsetX = this.valueToPixelH(this.frames);
        var action = this.lineSvg.polygon('0,5 5,0 10,5 5,10').move(offsetX - 5, lineIndex * 30 + 10 - this.xscrollTop).fill('#2D94E9');
        action.style('cursor','-webkit-grabbing');
        action.frame = this.frames;
        action.mousedown(function(event) {
            event.stopPropagation();

            action.fill('white');
            this.frames = action.frame;
            this.moveAction(action);
        }.bind(this));

        if (this.actions[lineIndex]) {
            this.actions[lineIndex].child.push({
                node: action,
                lineIndex: lineIndex,
            });
        }
        else {
            var lineGroup = {
                name: name,
                type: type,
                child: []
            };

            lineGroup.child.push({
                node: action,
                lineIndex: lineIndex,
            });

            this.actions.push(lineGroup);
        }

        this.repaintActions();
        this.updateLineDom();
    },

    removeLine: function (lineIndex) {

        for (var item in this.actions[lineIndex].child) {
            this.actions[lineIndex].child[item].node.remove();
        }

        this.actions.splice(lineIndex,1);
        this.repaintActions();
        this.updateLineDom();
    },

    moveAction: function (actionNode) {
        EditorUI.addDragGhost("-webkit-grabbing");
        var originX = actionNode.cx();
        var originY = actionNode.cy();
        var mousemoveHandle = function (event) {

            var dx = event.clientX - this._lastClientX;
            var frame = this.integerFrame(originX + dx);
            actionNode.move(this.valueToPixelH(frame) - 5, originY - 5);
            actionNode.frame = frame;

        }.bind(this);

        var mouseupHandle = function (event) {
            document.removeEventListener('mousemove', mousemoveHandle);
            document.removeEventListener('mouseup', mouseupHandle);
            actionNode.fill('#2D94E9');
            EditorUI.removeDragGhost();
        }.bind(this);

        this._lastClientX = event.clientX;

        document.addEventListener ( 'mousemove', mousemoveHandle );
        document.addEventListener ( 'mouseup', mouseupHandle );
    },

    repaintActions: function () {
        for (var i = 0; i < this.actions.length; i++) {
            for (var item in this.actions[i].child) {
                this.actions[i].child[item].node.move(
                    this.valueToPixelH(this.actions[i].child[item].node.frame) - 5,
                    i * 30 + 10 - this.xscrollTop
                );
            }
        }
    },

    updateLineDom: function () {
        this.$.actionItem.innerHTML = '';
        for (var i = 0; i < this.actions.length; i++) {
            var item = document.createElement('li');

            item.style.height = '30px';
            item.style.lineHeight = '30px';
            item.innerHTML = this.actions[i].name;
            item.setAttribute('lineIndex',i);
            item.addEventListener('dblclick',function (event) {
                this.createActionNode(event.target.getAttribute('lineIndex'));
            }.bind(this));
            this.$.actionItem.appendChild(item);
        }
    },

});
