function Point (x, y) {
    this.x = x;
    this.y = y;

    this.distance = function (p) {
        return Math.sqrt(Math.pow(p.x - this.x) + Math.pow(p.y - this.y));
    };

    this.dot = function (p) {
        return this.x * p.x + this.y * p.y;
    };

    this.scalarMult = function (scalar) {
        return new Point(this.x * scalar, this.y * scalar);
    };

    this.subtract = function (p) {
        return this.add(p.scalarMult(-1));
    };

    this.add = function (p) {
        return new Point(this.x + p.x, this.y + p.y);
    };

    this.cross = function (p) {
        return this.x * p.y - p.x * this.y;
    };

    this.leftTurn = function (p2, p3) {
        var v1 = p2.subtract(this);
        var v2 = p3.subtract(p2);
        if (v1.cross(v2) < 0) {
            return true;
        }
        return false;
    };

    this.rightTurn = function (p2, p3) {
        var v1 = p2.subtract(this);
        var v2 = p3.subtract(p2);
        if (v1.cross(v2) > 0) {
            return true;
        }
        return false;
    };

    this.draw = function (context) {
        context.beginPath();
        context.arc(this.x, 600-this.y, 5, 0, 2 * Math.PI, false);
        context.fillStyle = 'red';
        context.fill();
    };

}
Vector = Point;

function Line (a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;

    this.intersection = function (l) {
        if (this.a * l.b - this.b * l.a == 0) return undefined;
        a = this.a;
        b = this.b;
        e = this.c;
        c = l.a;
        d = l.b;
        f = l.c;
        return new Point((e*d-b*f)/(a*d-b*c),(a*f-e*c)/(a*d-b*c))
    };
}

function Ray(p,theta) {
    this.p = p;
    this.theta = theta;

    this.segmentIntersection = function (s) {
        lineIntersection = s.lineIntersection(this.toLine());
        if (lineIntersection == undefined) return undefined;

    };

    this.toLine = function (s) {
        return new LineSegment(p,new Point(this.p.x+Math.cos(theta),
                                           this.p.y+Math.sin(theta))).toLine();
    };
}

function LineSegment (p1, p2) {
    this.p1 = p1;
    this.p2 = p2;

    this.intersects = function (s) {
        return (this.p1.rightTurn(s.p1, s.p2) != this.p2.rightTurn(s.p1, s.p2)) &&
                (s.p1.rightTurn(this.p1, this.p2) != s.p2.rightTurn(this.p1, this.p2));
    };

    this.intersection = function (s) {
        if (!this.intersects(s)) return undefined;
        return this.toLine().intersection(s.toLine())
    };

    this.lineIntersection = function (l) {
        p = this.toLine().intersection(l);
        if (p == undefined) return undefined;
        if (p.x >= Math.min(this.p1.x, this.p2.x) && 
            p.x <= Math.max(this.p1.x, this.p2.x) &&
            p.y >= Math.min(this.p1.y, this.p2.y) &&
            p.y <= Math.max(this.p1.y, this.p2.y)) {
            return p;
        }
        return undefined;
    };

    this.toLine = function () {
        return new Line(this.p1.y - this.p2.y,
                        this.p2.x - this.p1.x,
                        -1*((this.p1.x - this.p2.x) * this.p1.y + (this.p2.y - this.p1.y) * this.p1.x));
    };

    this.draw = function (context) {
        context.strokeStyle = '#000'; //black
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(p1.x, 600-p1.y);
        context.lineTo(p2.x, 600-p2.y);
        context.closePath();
        context.stroke();
    };
}

function Polygon (pointList) {
    this.pointList = pointList;
    this.points = function () {
        return this.pointList;
    };

    this.push = function (p) {
        this.pointList.push(p);
    };

    this.pop = function () {
        return this.pointList.pop();
    };

    this.map = function (f) {
        this.pointList.map(f);
    };

    this.edges = function () {
        return this.pointList.map(function (p, index, array) {
            return new LineSegment(p, array[(index + 1) % array.length]);
        });
    };

    this.segmentIntersections = function (s) {
        return this.edges().map(function (e) {
            return e.intersection(s);
        }).filter(function (p) {return p != undefined});  
    };

    this.lineIntersections = function (l) {
        return this.edges().map(function (e) {
            return e.lineIntersection(l);
        }).filter(function (p) {return p != undefined});
    };

    this.containsPoint = function (p) {
        return this.lineIntersections(new LineSegment(p,
                                                 new Point(p.x,p.y+1)
                                                ).toLine()).filter(
                                                            function (a) { 
                                                                return a.y > p.y 
                                                            }).length%2 == 1;
    };

    this.visibleFrom = function (p) {
        if (!this.containsPoint(p)) return undefined;
        edges = this.edges();
        pl = this.pointList;
        var stack = [pl[0]];
        var condition = undefined;
        for (i=0;i<pl.length-1;i++) {
            point = pl.slice(1)[i];
            t = stack[stack.length-1]; // t for top
            if (p.rightTurn(t,point) && condition == undefined) {
                stack.push(point);
            } else {
                if (point.rightTurn(stack[stack.length-1],stack[stack.length-2])) {
                    // upward backtrack
                    if (condition == undefined) {
                        condition = function (pp) {
                            e = new LineSegment(pp,pl[(i+2)%pl.length]);
                            l = new LineSegment(p,t).toLine()
                            return e.lineIntersection(l);
                        };
                    } 
                    newPoint = condition(point);
                    if (newPoint != undefined) {
                        stack.push(newPoint);
                        condition = undefined;
                    }
                } else {
                    // downward backtrack
                    l = new LineSegment(p,point).toLine();
                    newPoint = new LineSegment(stack[stack.length-1],stack[stack.length-2]).lineIntersection(l);
                    while (newPoint == undefined) {
                        stack.pop();
                        newPoint = new LineSegment(stack[stack.length-1],stack[stack.length-2]).lineIntersection(l);
                    }
                    stack.pop();
                    stack.push(newPoint);
                    stack.push(point);
                }
            }
        }
        return new Polygon(stack);
    };

    this.draw = function (context) {

        context.strokeStyle = '#000'; //black
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(this.pointList.x, 600-this.pointList.y);
        this.pointList.slice(1).concat(this.pointList.slice(0,1)).map(function (p) {
            context.lineTo(p.x,600-p.y);
        });
        context.closePath();
        context.stroke();
        context.fillStyle = "rgba(0,255,0,0.1)";
        context.fill();
    };
}

function getCanvas() {
  return document.getElementById('canvas');
}
var points = [
              new Point(300, 0),
              new Point(250,250),
              new Point(50,100),
              new Point(120,250),
              new Point(0, 400),
              new Point(300, 500)
              ].reverse()
window.addEventListener('load', function() {
    var canvas = getCanvas();
    if(canvas && canvas.getContext) {
        var context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = '#fFf';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    // mouseMove();
    canvas.addEventListener('mousemove', mouseMove, false);
    canvas.addEventListener('mousedown', mouseDown, false);
}, false);

function getEventXCoord(ev){
    if (ev.layerX) { //Firefox
        return ev.layerX;
    }
    return ev.offsetX; //Opera
}

function getEventYCoord(ev){
    if (ev.layerY) { //Firefox
        return ev.layerY;
    }
    return ev.offsetY; //Opera
}
function mouseDown (ev) {
    var x = getEventXCoord(ev);
    var y = getEventYCoord(ev); 
    points.push(new Point(x, 600-y));
}

function mouseMove(ev) {
    //alert('t3');
    var canvas = getCanvas();
    context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f00'; //red
    context.strokeStyle = '#000'; //green
    context.lineWidth = 4;
    var x = getEventXCoord(ev);
    var y = getEventYCoord(ev);
    /*var seg1 = new LineSegment(new Point(200, 200), new Point(x, 600-y));
    seg1.draw(context);
    
    var seg2 = new LineSegment(new Point(200, 300), new Point(300, 250));

    seg2.draw(context);
    var intersectionPoint = seg1.intersection(seg2);
    if (intersectionPoint != undefined) {
        intersectionPoint.draw(context);
    }*/

    var poly1 = new Polygon(points);
    poly1.draw(context);
    var point1 = new Point(x,600-y)
    point1.draw(context);
    var poly2 = poly1.visibleFrom(point1);
    if (poly2) poly2.draw(context);
};