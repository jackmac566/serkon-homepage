
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Icon = Icon;
const React = __importStar(require("react"));
function Icon({ name = 'arrow', size = 20, ...props }) {
    const paths = {
        arrow: React.createElement(React.Fragment, null,
            React.createElement("path", { d: "M5 12h14M12 5l7 7-7 7" })), northeast: React.createElement(React.Fragment, null,
            React.createElement("path", { d: "M6 18 18 6M6 6h12v12" })), down: React.createElement(React.Fragment, null,
            React.createElement("path", { d: "M12 4v16M5 13l7 7 7-7" })), close: React.createElement("path", { d: "m6 6 12 12M6 18 18 6" }),
        menu: React.createElement(React.Fragment, null,
            React.createElement("path", { d: "M4 8h16M4 16h16" })), play: React.createElement("path", { d: "m9 5 11 7-11 7z" }), pause: React.createElement(React.Fragment, null,
            React.createElement("path", { d: "M9 5v14M15 5v14" })), check: React.createElement("path", { d: "m5 12 4 4L19 6" }),
        copy: React.createElement(React.Fragment, null,
            React.createElement("rect", { x: "8", y: "8", width: "12", height: "12", rx: "2" }),
            React.createElement("path", { d: "M16 8V4H4v12h4" })), globe: React.createElement(React.Fragment, null,
            React.createElement("circle", { cx: "12", cy: "12", r: "9" }),
            React.createElement("path", { d: "M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18" })),
        grid: React.createElement(React.Fragment, null,
            React.createElement("rect", { x: "4", y: "4", width: "6", height: "6", rx: "1" }),
            React.createElement("rect", { x: "14", y: "4", width: "6", height: "6", rx: "1" }),
            React.createElement("rect", { x: "4", y: "14", width: "6", height: "6", rx: "1" }),
            React.createElement("rect", { x: "14", y: "14", width: "6", height: "6", rx: "1" })),
        spark: React.createElement("path", { d: "m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8z" }), volume: React.createElement(React.Fragment, null,
            React.createElement("path", { d: "m4 9 5 0 5-4v14l-5-4H4zM18 8c3 3 3 5 0 8" })),
        mail: React.createElement(React.Fragment, null,
            React.createElement("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2" }),
            React.createElement("path", { d: "m3 6 9 7 9-7" })), image: React.createElement(React.Fragment, null,
            React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
            React.createElement("circle", { cx: "8", cy: "8", r: "1" }),
            React.createElement("path", { d: "m3 18 6-6 4 4 4-5 4 4" })),
    };
    return React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", ...props }, paths[name] || paths.arrow);
}

