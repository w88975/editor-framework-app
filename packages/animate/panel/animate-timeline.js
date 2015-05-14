Editor.registerPanel( 'animate-timeline.panel', {
    is: 'animate-timeline',

    properties: {
        frames: {
            type: Number,
            value: 0,
            observer: '_framesChanged',
        },
        actions: {
            type: Object,
            value: [],
            notify: true
        },

        nowValue: {
            type: Number,
            value: 0,
            notify: true,
            observer: '_valueChange'
        }
    },

    listeners: {
        'resize': '_onResize',
    },

    _valueChange: function () {
        if (this.nowObj) {
            this.nowObj.value = this.nowValue;
        }
    },

    ready: function () {
        this.nowObj = null;
        this.cables = [];
        //每个type有个default的value,当修改node的value后,defaultValue设置为修改的值.
        //defaultvalue用于每次createNode的时候设置value值
        this.defaultValue = {
            'Position': 0,
            'Color': 0,
            'Scale': 0,
            'Width': 0,
        };

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
            this.updateActions();
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

    // 把小数frame转换为整数并实现UI更新
    integerFrame: function (offsetX) {
        var nextFrames = this.pixelToValueH(offsetX);
        var integerPixel = this.valueToPixelH(Math.round(nextFrames));
        this.$.drag.style.left = integerPixel - 0.5;
        this.$.mousecube.style.left = integerPixel -0.5;
        this.frames = Math.round(nextFrames);
        this.drawMask();
        return this.frames;
    },

    _click: function (event) {
        event.stopPropagation();
        this.$.drag.style.display = 'block';
        this.$.mousecube.style.display = 'block';
        this.$.mask.style.display = 'block';

        this.integerFrame(event.offsetX);
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

        this.updateActions(this.xscrollTop);
    },

    // 模拟scroll操作 用更像background的position来实现
    repositionBackground: function (top) {
        this.$.action.style.backgroundPosition = '0 ' + -top + 'px';
        this.$.lineBg.style.backgroundPosition = '0 ' + -top + 'px';
    },

    // 增加一行type
    'timeline:add-type': function (detail) {
        var lineIndex = this.actions.length;
        var type = detail;

        for (var item in this.actions) {
            if (this.actions[item].type === type ) {
                return ;
            }
        }
        this.createActionNode(lineIndex,null,type);

        this.xscrollTop = this.$.actionItem.scrollHeight - this.$.actionItem.getBoundingClientRect().height;
        this.$.actionItem.scrollTop = this.xscrollTop;
        this.repositionBackground(this.xscrollTop);
    },

    'timeline:delete-type': function (detail) {
        this.removeLine(detail);
    },

    'timeline:add-child': function (detail) {
        this.createActionNode(detail,null,null);
    },

    'timeline:delete-node': function (detail) {
        this.removeNode(detail);
    },

    _addItem: function (event) {
        var rect  = event.target.getBoundingClientRect();

        Editor.Menu.popup( rect.left + 5, rect.bottom + 5, [
            { label: 'Position', message: 'timeline:add-type', params: ['Position'] },
            { label: 'Color', message: 'timeline:add-type', params: ['Color'] },
            { label: 'Size', message: 'timeline:add-type', params: ['Size'] },
            { label: 'Scale', message: 'timeline:add-type', params: ['Scale'] },
            { label: 'Width', message: 'timeline:add-type', params: ['Width'] },
            { label: 'Height', message: 'timeline:add-type', params: ['Height'] },
        ]);
    },

    //链接两个node节点
    mergeNode: function (start,end) {
        var sX = this.valueToPixelH(start.frame);
        var eX = this.valueToPixelH(end.frame);
        var sY = this.valueToPixelH(start.target.lineIndex * 30 +10);
        var width = eX - sX;
        var ceble = this.lineSvg.polyline('0,0 '+width+',0 '+width+',10 0,10').fill('white').move(
            sX,
            sY
        );

        this.cables.push({
            node: ceble,
            start: start,
            end: end,
        });
        this.repaintActions();
    },

    //创建一个node,如果type已经存在,则在type后追加,不存在则新建一行type
    createActionNode: function (lineIndex,frame,type) {
        // 判断当前frame是否存在node节点
        if (parseInt(lineIndex) !== this.actions.length) {
            for (var i = 0; i < this.actions[lineIndex].child.length; i++) {
                if (this.actions[lineIndex].child[i].node.frame === this.frames) {
                    return;
                }
            }
        }

        var _frame = this.frames;

        if (frame) {
            _frame = frame;
        }
        var splitType = null; //TODO DELTE
        var action = this.drawNode(lineIndex,_frame,splitType);

        if (this.actions[lineIndex]) {
            this.actions[lineIndex].child.push({
                node: action,
                frame: _frame,
                value: 0,
                target: this.actions[lineIndex],
            });
        }
        else {
            var lineGroup = {
                type: type,
                lineIndex: lineIndex,
                child: []
            };

            lineGroup.child.push({
                node: action,
                frame: _frame,
                value: 0,
                target: lineGroup,
            });

            this.actions.push(lineGroup);
        }

        this.repaintActions();
    },

    //删除整行
    removeLine: function (lineIndex) {

        for (var item in this.actions[lineIndex].child) {
            this.actions[lineIndex].child[item].node.remove();
        }

        this.actions.splice(lineIndex,1);

        for (var i=0; i< this.actions.length; i++) {
            for (var j=0; j < this.actions[i].child.length ;j ++) {
                this.actions[i].child[j].target.lineIndex = i;
            }
        }

        this.updateActions();
    },

    // 通过UUID删除一个node节点
    removeNode: function (uuid) {
        for (var i = 0; i < this.actions.length; i++) {
            for (var j = 0; j < this.actions[i].child.length; j ++) {
                if (this.actions[i].child[j].node.uuid === uuid) {
                    this.actions[i].child[j].node.remove();
                    this.actions[i].child.splice(j,1);
                }
            }
        }
    },

    // 单个node的move操作
    moveAction: function (uuid) {
        EditorUI.addDragGhost("-webkit-grabbing");
        var child = this.uuidToObj(uuid);
        if (!child) {
            mouseupHandle();
            return;
        }
        var originX = child.node.cx();
        var originY = child.node.cy();

        var mousemoveHandle = function (event) {

            var dx = event.clientX - this._lastClientX;
            var frame = this.integerFrame(originX + dx);
            if (frame <= 0) {
                this.frames = 0;
                frame = 0;
            }

            child.node.move(this.valueToPixelH(frame) - 4.7, originY - 5);
            child.node.frame = frame;
            child.frame = frame;
        }.bind(this);

        var mouseupHandle = function (event) {
            document.removeEventListener('mousemove', mousemoveHandle);
            document.removeEventListener('mouseup', mouseupHandle);
            child.node.fill('#2D94E9');
            this.shortActions();
            EditorUI.removeDragGhost();
        }.bind(this);

        this._lastClientX = event.clientX;

        document.addEventListener ( 'mousemove', mousemoveHandle );
        document.addEventListener ( 'mouseup', mouseupHandle );
    },

    //缩放的时候 不进行重绘 而是更新node的position
    updateActions: function () {
        for (var i = 0; i < this.actions.length; i++) {
            for (var item in this.actions[i].child) {
                this.actions[i].child[item].node.move(
                    this.valueToPixelH(this.actions[i].child[item].node.frame) - 4.7,
                    i * 30 + 10 - this.xscrollTop
                );
            }
        }
    },


    //删掉所有的node节点,重绘node
    repaintActions: function () {
        for (var i = 0; i < this.actions.length; i++) {
            for (var item in this.actions[i].child) {
                this.actions[i].child[item].node.remove();
                this.actions[i].child[item].node = this.drawNode(i,this.actions[i].child[item].frame);
            }
        }
        this.shortActions();
    },

    uuid: function() {
        var S4 = function ()
        {
            return Math.floor(
                Math.random() * 0x10000
            ).toString(16);
        };

        return (
            S4() + S4() + "-" +
                S4() + "-" +
                S4() + "-" +
                S4() + "-" +
                S4() + S4() + S4()
        );
    },

    uuidToObj: function (uuid) {
        for (var i = 0;i < this.actions.length; i++) {
            for (var j = 0; j < this.actions[i].child.length; j ++) {
                if (this.actions[i].child[j].node.uuid === uuid) {
                    return this.actions[i].child[j];
                }
            }
        }
    },

    //画连接线
    drawCable: function () {
        for (var index in this.actions) {
            for (var t = 0; t < this.actions[index].child.length; t++) {
                if (this.actions[index].child[t+1]) {
                    if ( this.actions[index].child[t].value !== this.actions[index].child[t+1].value) {
                        this.mergeNode(this.actions[index].child[t],this.actions[index].child[t+1]);
                    }
                }
            }
        }
    },

    test: function () {
        // var arr = [1,2,2,3,3,4,5,6,6,7];
        var temp = [];
        // for (var i = 0; i < arr.length + 1; i++) {
        //     if (i < arr.length) {
        //         temp.push(arr[i]);
        //     }
        //     if (arr[i] === arr[i+1]) {
        //         console.log(temp);
        //         temp = [];
        //     }
        // }

        for (var index in this.actions) {
            for (var t = 0; t < this.actions[index].child.length ; t++) {
                temp.push(this.actions[index].child[t].node.uuid);
                if (t === this.actions[index].child.length - 1) {
                    console.log(temp);
                }else{
                    if (this.actions[index].child[t].value === this.actions[index].child[t + 1].value) {
                        console.log(temp);
                        temp = [];
                        console.log('-------------------');
                    }
                }
            }
        }
    },

    //对actions按照frame进行排序
    shortActions: function() {
        for (var i = 0; i < this.actions.length; i++) {
            for (var j = 0; j < this.actions[i].child.length; j++) {
                var arr = this.actions[i].child;
                var m = arr.length, n;
                var tempExchangVal;
                while(m > 0) {
                    for( n = 0; n < m-1; n++) {
                        if(arr[n].frame > arr[n + 1].frame) {
                            tempExchangVal = arr[n];
                            arr[n] = arr[n+1];
                            arr[n+1] = tempExchangVal;
                        }
                    }
                    m--;
                }
                this.actions[i].child = arr;
            }
        }
    },

    // PS:禁止直接调用
    // 绘制一个node节点的基本方法 line是type所在行,frame是帧数,TODO: split为node节点是否分离成两个三角形的判断
    drawNode: function (line,frame,split) {
        var offsetX = this.valueToPixelH(frame);
        var node = this.lineSvg.polygon('0,5 5,0 10,5 5,10').move(this.valueToPixelH(frame) - 4.7, line * 30 + 10 - this.xscrollTop).fill('#2D94E9');
        node.style('cursor','-webkit-grabbing');
        node.frame = frame;
        node.uuid = this.uuid();
        node.mousedown(function(event) {
            event.stopPropagation();
            if (event.button === 0) {
                node.fill('white');
                this.frames = node.frame;
                this.moveAction(node.uuid);
            }
            else if (event.button === 2) {
                Editor.Menu.popup( event.clientX + 5, event.clientY , [
                    { label: 'Delete', message: 'timeline:delete-node', params: [node.uuid] },
                ]);

            }
            this.nowObj = this.uuidToObj(node.uuid);
            this.nowValue = this.uuidToObj(node.uuid).value;
        }.bind(this));

        return node;
    },

    // 在当前type下创建一个兄弟节点
    _createBrother: function ( event ) {
        event.stopPropagation();
        var line = this._getIndex(event.target.parentElement);
        this.createActionNode(line,null,null);
    },

    //获取element所在的index
    _getIndex: function (ele) {
        var index;
        for (var i = 0; i < this.$.actionItem.children.length; i++) {
            if (ele === this.$.actionItem.children[i]) {
                index = i;
            }
        }
        return index;
    },

    _rightContextMenu: function ( event ) {
        event.stopPropagation();

        if ( event.button === 2 ) {
            var line = this._getIndex(event.currentTarget);
            Editor.Menu.popup( event.clientX + 5, event.clientY , [
                { label: 'create new', message: 'timeline:add-child', params: [line] },
                { label: 'delete', message: 'timeline:delete-type', params: [line] },
            ]);
        }
    },

});
