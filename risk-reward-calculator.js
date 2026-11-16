const predef = require('./tools/predef');
const { du, op, px } = require("./tools/graphics");

const FIFTY_TP_LABEL = "50%";
const FIFTY_SL_LABEL = "-50%";

const PositionSizeTool = {

    init() {
        return { mode: 'none' };
    },

    update({ anchors }) {
        return { mode: 'none' };
    },

    render({ anchors, props, state }) {
        const mode = 'none';
        const { targetRiskRewardRatio, tickValue, riskAmount, labelsOnRight } = props;

        const a01xdistance = anchors[1] ? anchors[1].x.value - anchors[0].x.value : 0;
        const a02ydistance = anchors[1] ? anchors[1].y.value - anchors[0].y.value : 0;
        const profitTarget = a02ydistance * targetRiskRewardRatio;
        const tpDistance   = anchors[1] ? op(du(anchors[0].y.value), "+", du(profitTarget)) : 0;
        const slDistance   = anchors[1] ? op(anchors[0].y, "-", du(a02ydistance)) : 0;
        const buyTP        = anchors[1] && anchors[1].y.value < anchors[0].y.value;

        const slPts           = Math.abs(a02ydistance);
        const riskPerContract = slPts * tickValue;
        const contracts       = riskPerContract > 0
            ? Math.max(1, Math.floor(riskAmount / riskPerContract))
            : 1;
        const actualRisk  = contracts * riskPerContract;
        const reward      = contracts * Math.abs(profitTarget) * tickValue;
        const rrRatio     = slPts > 0
            ? (Math.abs(profitTarget) / slPts).toFixed(2)
            : "—";

        const labelX         = labelsOnRight ? anchors[1] && anchors[1].x : anchors[0] && anchors[0].x;
        const alignBelow     = labelsOnRight ? 'rightBelow' : 'leftBelow';
        const alignAbove     = labelsOnRight ? 'rightAbove' : 'leftAbove';

        const baseLine = anchors[1] ? [{
            tag: 'LineSegments',
            key: 'centreLine',
            lines: [{ tag: 'Line', a: anchors[0], b: { x: anchors[1].x, y: anchors[0].y } }],
            lineStyle: { lineWidth: 1, color: props.neutralColor }
        }] : [];

        const plLine = anchors[1] ? [{
            tag: 'LineSegments',
            key: 'lossLine',
            lines: [{ tag: 'Line',
                a: { x: anchors[0].x, y: anchors[1].y },
                b: { x: anchors[1].x, y: anchors[1].y }
            }],
            lineStyle: { lineWidth: 1, color: props.lossColor }
        }, {
            tag: 'LineSegments',
            key: 'profitLine',
            lines: [{ tag: 'Line',
                a: { x: anchors[0].x, y: tpDistance },
                b: { x: anchors[1].x, y: tpDistance }
            }],
            lineStyle: { lineWidth: 1, color: props.profitColor }
        }] : [];

        const profitShade = anchors[1] && props.showShade ? [{
            tag: 'Shapes', key: 'topshade',
            primitives: [{ tag: 'Rectangle',
                position: { x: anchors[0].x, y: anchors[0].y },
                size: { height: du(-profitTarget), width: du(a01xdistance) }
            }],
            fillStyle: { opacity: props.opacity, color: props.profitColor }
        }] : [];

        const lossShade = anchors[1] && props.showShade ? [{
            tag: 'Shapes', key: 'bottomshade',
            primitives: [{ tag: 'Rectangle',
                position: { x: anchors[0].x, y: anchors[0].y },
                size: { height: du(a02ydistance), width: du(a01xdistance) }
            }],
            fillStyle: { opacity: props.opacity, color: props.lossColor }
        }] : [];

        const riskSize = anchors[1] ? [{
            tag: 'Text', key: 'riskLabel',
            point: { x: labelX, y: buyTP ? op(slDistance, "+", px(3)) : op(slDistance, "-", px(3)) },
            text: `SL: ${slPts.toFixed(1)} pts | -$${actualRisk.toFixed(2)}`,
            style: { fontSize: 12, fill: props.lossColor },
            textAlignment: buyTP ? alignBelow : alignAbove,
        }, {
            tag: 'Text', key: 'profitLabel',
            point: { x: labelX, y: buyTP ? op(tpDistance, "-", px(12)) : op(tpDistance, "+", px(12)) },
            text: `TP: ${Math.abs(profitTarget).toFixed(1)} pts | +$${reward.toFixed(2)}`,
            style: { fontSize: 12, fill: props.profitColor },
            textAlignment: buyTP ? alignAbove : alignBelow,
        }] : [];

        const valueSize = anchors[0] ? [{
            tag: 'Text', key: 'EntryLabel',
            point: { x: anchors[0].x, y: op(du(anchors[0].y.value), '+', px(3)) },
            text: `${contracts} ${contracts === 1 ? 'contract' : 'contracts'} | R:R 1:${rrRatio}`,
            style: { fontSize: 12, fill: props.neutralColor },
            textAlignment: 'rightBelow',
        }] : [];

        // --- 50% TP line (lime green) ---
        const halfTP = anchors[0].y.value - (profitTarget * 0.5);

        const fiftyTPLine = anchors[1] && props.showTP50 ? [{
            tag: 'LineSegments',
            key: 'halfTPLineSolid',
            lines: [{
                tag: 'Line',
                a: { x: anchors[0].x, y: du(halfTP) },
                b: { x: anchors[1].x, y: du(halfTP) }
            }],
            lineStyle: { lineWidth: 3, color: '#32CD32' } // LimeGreen
        }, {
            tag: 'Text', key: 'fiftyTPLabel',
            point: {
                x: labelX,
                y: buyTP ? op(du(halfTP), '-', px(3)) : op(du(halfTP), '+', px(3))
            },
            text: FIFTY_TP_LABEL,
            style: { fontSize: 12, fill: '#00DD00' },
            textAlignment: buyTP ? alignAbove : alignBelow,
        }] : [];
        // ----------------------------------

        const halfSL = anchors[0].y.value + (a02ydistance * 0.5);

        const fiftySLLine = anchors[1] && props.showSL50 ? [{
            tag: 'LineSegments',
            key: 'halfSLLine',
            lines: [{
                tag: 'Line',
                a: { x: anchors[0].x, y: du(halfSL) },
                b: { x: anchors[1].x, y: du(halfSL) }
            }],
            lineStyle: { lineWidth: 3, color: '#ff0000' }
        }, {
            tag: 'Text', key: 'fiftySLLabel',
            point: {
                x: labelX,
                y: buyTP ? op(du(halfSL), '+', px(3)) : op(du(halfSL), '-', px(3))
            },
            text: FIFTY_SL_LABEL,
            style: { fontSize: 12, fill: '#ff0000' },
            textAlignment: buyTP ? alignBelow : alignAbove,
        }] : [];

        return {
            items: [
                ...baseLine,
                ...profitShade,
                ...lossShade,
                ...plLine,
                ...riskSize,
                ...valueSize,
                ...fiftyTPLine,
                ...fiftySLLine,
            ],
            state: mode === state.mode
                ? state
                : this.update({ anchors, state, props })
        };
    },

    anchorRestraints({ anchors }) {
        const r = anchors[1] ? { x: [anchors[0].x.value, anchors[0].x.value + 10000] } : {};
        return [{}, r];
    },

    anchorStyles({ props }) {
        return [{ color: props.neutralColor }, { color: props.lossColor }];
    }
};

module.exports = {
    name: "PositionSizeTool",
    drawing: PositionSizeTool,
    description: "Risk Reward",
    params: {
        profitColor:           predef.paramSpecs.color('#0d0'),
        lossColor:             predef.paramSpecs.color('#d00'),
        neutralColor:          predef.paramSpecs.color('#999'),
        opacity:               predef.paramSpecs.percent(7, 1, 0, 100),
        showShade:             predef.paramSpecs.bool(true),
        labelsOnRight:         predef.paramSpecs.bool(false),
        showTP50:              predef.paramSpecs.bool(false),
        showSL50:              predef.paramSpecs.bool(false),
        tickValue:             predef.paramSpecs.number(2, 0.01, 0), // Default = MNQ (Micro Nasdaq): $2.00 per point
        riskAmount:            predef.paramSpecs.number(200, 1, 0),
        targetRiskRewardRatio: predef.paramSpecs.number(1, 0.25, 0),
    },
    maxN: 2
};
