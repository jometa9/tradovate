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

        const {
            targetRiskRewardRatio,
            tickValue,
            tickSize,
            riskAmount,
            labelsOnRight
        } = props;

        // ----------------------------------
        // ANCHORS AND PRICE CALCULATIONS
        // Anchor 1 = Entry
        // Anchor 2 = Stop Loss
        // ----------------------------------

        const hasAnchors = !!anchors[1];

        const entryPrice = anchors[0]
            ? anchors[0].y.value
            : 0;

        const stopPrice = hasAnchors
            ? anchors[1].y.value
            : 0;

        const a01xdistance = hasAnchors
            ? anchors[1].x.value - anchors[0].x.value
            : 0;

        const stopDelta = hasAnchors
            ? stopPrice - entryPrice
            : 0;

        const slPts = Math.abs(stopDelta);

        // Stop below entry = BUY
        // Stop above entry = SELL
        const buyTP = hasAnchors && stopPrice < entryPrice;

        // Ratio > 0: TP on the opposite side of the stop (normal)
        // Ratio < 0: TP on the SAME side as the stop
        const profitMove = -stopDelta * targetRiskRewardRatio;

        const profitPts = Math.abs(profitMove);

        // +1 = normal profit, -1 = TP placed on the loss side
        const rrSign = targetRiskRewardRatio < 0 ? -1 : 1;

        // true = TP line is above entry
        const tpIsUp = profitMove !== 0
            ? profitMove > 0
            : buyTP;

        const tpPrice = entryPrice + profitMove;

        const tpDistance = du(tpPrice);
        const slDistance = du(stopPrice);

        // ----------------------------------
        // POSITION SIZE CALCULATION
        // MNQ DEFAULT:
        // Tick size = 0.25 points
        // Tick value = $0.50
        // ----------------------------------

        const safeTickSize = tickSize > 0
            ? tickSize
            : 0.25;

        const safeTickValue = tickValue >= 0
            ? tickValue
            : 0.50;

        // Round SL ticks UP to avoid understating risk
        const slTicks = slPts > 0
            ? Math.ceil(slPts / safeTickSize - 0.000000001)
            : 0;

        const riskPerContract = slTicks * safeTickValue;

        // Always round contracts DOWN
        // Never force a minimum of 1 contract
        const contracts = riskPerContract > 0
            ? Math.floor(riskAmount / riskPerContract)
            : 0;

        const actualRisk = contracts * riskPerContract;

        // Round TP ticks DOWN
        const tpTicks = profitPts > 0
            ? Math.floor(profitPts / safeTickSize + 0.000000001)
            : 0;

        // Signed reward (negative when ratio is negative)
        const reward = contracts * tpTicks * safeTickValue * rrSign;

        const rrRatio = slPts > 0
            ? ((rrSign * profitPts) / slPts).toFixed(2)
            : "—";

        // Label: ratio >= 1 -> "1:2" (risk 1, reward 2)
        //        ratio <  1 -> "10:1" (risk 10, reward 1), e.g. ratio 0.1
        const rrValue = slPts > 0 ? profitPts / slPts : 0;

        const rrLabel = slPts > 0
            ? (rrValue > 0 && rrValue < 1
                ? `${(1 / rrValue).toFixed(2).replace(/\.?0+$/, '')}:1`
                : `1:${rrValue.toFixed(2).replace(/\.?0+$/, '')}`)
            : "—";

        const rewardText = `${reward < 0 ? '-' : '+'}$${Math.abs(reward).toFixed(2)}`;

        // ----------------------------------
        // LABEL POSITIONS
        // ----------------------------------

        const labelX = labelsOnRight
            ? anchors[1] && anchors[1].x
            : anchors[0] && anchors[0].x;

        const alignBelow = labelsOnRight
            ? 'rightBelow'
            : 'leftBelow';

        const alignAbove = labelsOnRight
            ? 'rightAbove'
            : 'leftAbove';

        // ----------------------------------
        // ENTRY LINE
        // ----------------------------------

        const baseLine = hasAnchors ? [{
            tag: 'LineSegments',
            key: 'centreLine',
            lines: [{
                tag: 'Line',
                a: anchors[0],
                b: {
                    x: anchors[1].x,
                    y: anchors[0].y
                }
            }],
            lineStyle: {
                lineWidth: 1,
                color: props.neutralColor
            }
        }] : [];

        // ----------------------------------
        // TP AND SL LINES
        // ----------------------------------

        const plLine = hasAnchors ? [{
            tag: 'LineSegments',
            key: 'lossLine',
            lines: [{
                tag: 'Line',
                a: {
                    x: anchors[0].x,
                    y: slDistance
                },
                b: {
                    x: anchors[1].x,
                    y: slDistance
                }
            }],
            lineStyle: {
                lineWidth: 1,
                color: props.lossColor
            }
        }, {
            tag: 'LineSegments',
            key: 'profitLine',
            lines: [{
                tag: 'Line',
                a: {
                    x: anchors[0].x,
                    y: tpDistance
                },
                b: {
                    x: anchors[1].x,
                    y: tpDistance
                }
            }],
            lineStyle: {
                lineWidth: 1,
                color: props.profitColor
            }
        }] : [];

        // ----------------------------------
        // PROFIT SHADE
        // ----------------------------------

        const profitShade = hasAnchors && props.showShade ? [{
            tag: 'Shapes',
            key: 'topshade',
            primitives: [{
                tag: 'Rectangle',
                position: {
                    x: anchors[0].x,
                    y: anchors[0].y
                },
                size: {
                    height: du(-profitMove),
                    width: du(a01xdistance)
                }
            }],
            fillStyle: {
                opacity: props.opacity,
                color: props.profitColor
            }
        }] : [];

        // ----------------------------------
        // LOSS SHADE
        // ----------------------------------

        const lossShade = hasAnchors && props.showShade ? [{
            tag: 'Shapes',
            key: 'bottomshade',
            primitives: [{
                tag: 'Rectangle',
                position: {
                    x: anchors[0].x,
                    y: anchors[0].y
                },
                size: {
                    height: du(stopDelta),
                    width: du(a01xdistance)
                }
            }],
            fillStyle: {
                opacity: props.opacity,
                color: props.lossColor
            }
        }] : [];

        // ----------------------------------
        // RISK AND PROFIT LABELS
        // ----------------------------------

        const riskSize = hasAnchors ? [{
            tag: 'Text',
            key: 'riskLabel',
            point: {
                x: labelX,
                y: buyTP
                    ? op(slDistance, "+", px(3))
                    : op(slDistance, "-", px(3))
            },
            text: `SL: ${slPts.toFixed(2)} pts | -$${actualRisk.toFixed(2)}`,
            style: {
                fontSize: 12,
                fill: props.lossColor
            },
            textAlignment: buyTP ? alignBelow : alignAbove
        }, {
            tag: 'Text',
            key: 'profitLabel',
            point: {
                x: labelX,
                y: tpIsUp
                    ? op(tpDistance, "-", px(12))
                    : op(tpDistance, "+", px(12))
            },
            text: `TP: ${profitPts.toFixed(2)} pts | ${rewardText}`,
            style: {
                fontSize: 12,
                fill: props.profitColor
            },
            textAlignment: tpIsUp ? alignAbove : alignBelow
        }] : [];

        // ----------------------------------
        // CONTRACTS AND R:R LABEL
        // ----------------------------------

        const valueSize = anchors[0] ? [{
            tag: 'Text',
            key: 'EntryLabel',
            point: {
                x: anchors[0].x,
                y: op(du(entryPrice), '+', px(3))
            },
            text: `${contracts} ${contracts === 1 ? 'contract' : 'contracts'} | R:R ${rrLabel}`,
            style: {
                fontSize: 12,
                fill: props.neutralColor
            },
            textAlignment: 'rightBelow'
        }] : [];

        // ----------------------------------
        // 50% TP LINE
        // ----------------------------------

        const halfTP = entryPrice + (profitMove * 0.5);

        const fiftyTPLine = hasAnchors && props.showTP50 ? [{
            tag: 'LineSegments',
            key: 'halfTPLineSolid',
            lines: [{
                tag: 'Line',
                a: {
                    x: anchors[0].x,
                    y: du(halfTP)
                },
                b: {
                    x: anchors[1].x,
                    y: du(halfTP)
                }
            }],
            lineStyle: {
                lineWidth: 3,
                color: '#32CD32'
            }
        }, {
            tag: 'Text',
            key: 'fiftyTPLabel',
            point: {
                x: labelX,
                y: tpIsUp
                    ? op(du(halfTP), "-", px(3))
                    : op(du(halfTP), "+", px(3))
            },
            text: FIFTY_TP_LABEL,
            style: {
                fontSize: 12,
                fill: '#00DD00'
            },
            textAlignment: tpIsUp ? alignAbove : alignBelow
        }] : [];

        // ----------------------------------
        // 50% SL LINE
        // ----------------------------------

        const halfSL = entryPrice + (stopDelta * 0.5);

        const fiftySLLine = hasAnchors && props.showSL50 ? [{
            tag: 'LineSegments',
            key: 'halfSLLine',
            lines: [{
                tag: 'Line',
                a: {
                    x: anchors[0].x,
                    y: du(halfSL)
                },
                b: {
                    x: anchors[1].x,
                    y: du(halfSL)
                }
            }],
            lineStyle: {
                lineWidth: 3,
                color: '#ff0000'
            }
        }, {
            tag: 'Text',
            key: 'fiftySLLabel',
            point: {
                x: labelX,
                y: buyTP
                    ? op(du(halfSL), "+", px(3))
                    : op(du(halfSL), "-", px(3))
            },
            text: FIFTY_SL_LABEL,
            style: {
                fontSize: 12,
                fill: '#ff0000'
            },
            textAlignment: buyTP ? alignBelow : alignAbove
        }] : [];

        // ----------------------------------
        // RETURN DRAWING
        // ----------------------------------

        return {
            items: [
                ...baseLine,
                ...profitShade,
                ...lossShade,
                ...plLine,
                ...riskSize,
                ...valueSize,
                ...fiftyTPLine,
                ...fiftySLLine
            ],
            state: mode === state.mode
                ? state
                : this.update({ anchors, state, props })
        };
    },

    anchorRestraints({ anchors }) {
        const r = anchors[1]
            ? {
                x: [
                    anchors[0].x.value,
                    anchors[0].x.value + 10000
                ]
            }
            : {};

        return [{}, r];
    },

    anchorStyles({ props }) {
        return [
            { color: props.neutralColor },
            { color: props.lossColor }
        ];
    }
};

module.exports = {
    name: "PositionSizeTool",
    drawing: PositionSizeTool,
    description: "Risk Reward",

    params: {
        profitColor: predef.paramSpecs.color('#0d0'),
        lossColor: predef.paramSpecs.color('#d00'),
        neutralColor: predef.paramSpecs.color('#999'),

        opacity: predef.paramSpecs.percent(7, 1, 0, 100),

        showShade: predef.paramSpecs.bool(true),
        labelsOnRight: predef.paramSpecs.bool(false),
        showTP50: predef.paramSpecs.bool(false),
        showSL50: predef.paramSpecs.bool(false),

        // MNQ DEFAULT SETTINGS
        tickSize: predef.paramSpecs.number(0.25, 0.01, 0),
        tickValue: predef.paramSpecs.number(0.50, 0.01, 0),

        riskAmount: predef.paramSpecs.number(200, 1, 0),

        // Step 0.01 so you can type values like 0.1 (TP = 1/10 of the SL)
        targetRiskRewardRatio: predef.paramSpecs.number(1, 0.01, 0)
    },

    maxN: 2
};
