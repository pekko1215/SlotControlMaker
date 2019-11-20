//制御を司るクラス
const SlotControlMaker = {
        Machine: class {
            //ベット可能枚数や、有効ラインについて定義する。
            constructor(bet1, bet2, bet3) {
                this.modes = [];
                this.betLines = [bet1, bet2, bet3];
                this.displayRange = [3, 3, 3];
            }
            addMode(mode) {
                this.modes.push(mode);
            }
            setReels(reels) {
                this.reels = reels;
            }
            setChips(chips) {
                this.chips = chips;
            }
            setSymbols(symbols) {
                this.symbols = symbols
            }
            setChipGroups(chipGroups) {
                this.chipGroups = chipGroups;
            }
            setSpecialSymbols(specialSymbols) {
                this.specialSymbols = specialSymbols;
            }
            setControls(controls) {
                this.controls = controls;
            }
            generate() {
                //評価値式を採用する
                //リーチ目、有効ラインなどで得点を決める
                //将来的な4リールにも対応させたいから、3はイカんよなぁ！？      
                this.dynamicTables = {};
                const MaxSlip = 4;
                return new SlotControlMaker.Result(this.controls.map((control) => {
                    //どの順番で定義していくかを決定する。
                    console.log(control.name + ':開始')
                    console.timeEnd();
                    console.time()
                    let orderTmp = [...Array(this.reels.length).keys()];
                    let orders = Combinatorics.permutation(orderTmp).toArray();
                    return {
                        name: control.name,
                        control: orders.map((order) => {
                            let stopTmp = [];
                            console.log(`押し順[${order.toString()}]開始`)
                            let fn = (order) => {
                                let stopNum = order[0];
                                let slipResults = [];
                                for (let stopPos = 0; stopPos < this.reels[stopNum].length; stopPos++) {
                                    let slipPoints = [];
                                    for (let s = 0; s <= MaxSlip; s++) {
                                        stopTmp[stopNum] = (stopPos - s + this.reels[stopNum].length) % this.reels[stopNum].length
                                        let p;
                                        if (order.length === 1) {
                                            p = {
                                                value: this.evalSymbols(stopTmp, control),
                                                slip: s
                                            }
                                            if (p.value === null) continue
                                        } else {
                                            let arr = fn(order.slice(1));
                                            if (arr === null) {
                                                continue
                                            }
                                            let sumValue = arr.reduce((a, b) => {
                                                let ret = {
                                                    value: a.value + b.value
                                                }
                                                delete a.value;
                                                delete b.value;
                                                return ret;
                                            });
                                            p = {
                                                value: sumValue.value,
                                                slip: s,
                                                tree: arr
                                            }
                                        }
                                        slipPoints.push(p)
                                    }
                                    if (slipPoints.length === 0) return null;
                                    let maxPoint = slipPoints.reduce((a, b) => {
                                        return a.value >= b.value ? a : b;
                                    })
                                    slipResults.push(maxPoint);
                                }
                                return slipResults
                            }
                            return fn(order).map(arr => {
                                delete arr.value
                                return arr;
                            });
                        })
                    }
                }));
            }
            evalSymbols(positions, control) {
                let dynamicName = `${control.mode}|${control.bet}|${positions.toString()}`
                let { mode, bet } = control;

                let lines = this.betLines[bet - 1];
                let hitLines;
                let specialSymbols;
                let hitCount = 0;

                if (this.dynamicTables[dynamicName]) {
                    hitLines = this.dynamicTables[dynamicName].hitLines;
                    specialSymbols = this.dynamicTables[dynamicName].specialSymbols
                } else {
                    hitLines = this.pickUpLine(positions, lines).map(line => this.checkHit(line));
                    specialSymbols = this.checkSpecialSymbols(positions);
                    this.dynamicTables[dynamicName] = {
                        hitLines,
                        specialSymbols
                    }
                }

                for (let specialSymbol of specialSymbols) {
                    let { tags } = specialSymbol;
                    if (!tags.every(tag => control.specialSymbols.find(s => s === tag))) {
                        return null;
                    }
                }

                let symbols = control.symbols.map(s => this.nameToSymbols(s)).flat();
                if (hitLines.every((arr) => {
                        if (arr.every(s => {
                                if (symbols.includes(s)) {
                                    hitCount++;
                                    return true;
                                }
                            })) {
                            return true;
                        }
                    })) {
                    return hitCount * specialSymbols.length;
                }
                return null;
            }
            checkHit(line) {
                return this.symbols.filter(s => {
                    return s.chips.every((c, i) => {
                        if (!c) return true;
                        return this.nameToChips(c).find(c2 => c2 === line[i]);
                    })
                })
            }
            pickUpLine(positions, lines) {
                let chipMatrix = positions.map((pos, i) => {
                    let arr = [];
                    for (let k = 0; k < this.displayRange[i]; k++) {
                        let n = (pos + k) % this.reels[i].length;
                        arr.push(this.reels[i].chips[n])
                    }
                    return arr;
                })
                return lines.map(line => {
                    return line.map((p, i) => chipMatrix[i][p]);
                })
            }
            nameToChips(name) {
                let obj = this.chipGroups.find(g => g.name === name) || this.chips.find(g => g.name === name);
                if (obj instanceof SlotControlMaker.ChipGroup) {
                    return obj.chips
                }
                if (obj instanceof SlotControlMaker.Chip) {
                    return [obj]
                }
                throw `Chip name Error ${name}`;
            }
            nameToSymbols(name) {
                return this.symbols.find(s => s.name === name);
            }
            checkSpecialSymbols(positions) {
                return this.specialSymbols.filter((specialSymbol) => {
                    let flag = specialSymbol.symbol.every((v, i) => {
                        if (v instanceof Array) {
                            return v.every((chipGroup, h) => {
                                if (chipGroup === null) return true
                                let chips = this.nameToChips(chipGroup);
                                let p = positions[i] + h;
                                p = p % this.reels[i].length;
                                return chips.includes(this.reels[i][p])
                            });
                        } else {
                            return v === null || positions[i] === v;
                        }
                    })
                    return flag;
                });
            }

        },
        //制御コードに対応する
        Control: class {
            constructor(name, symbols = [], lines = [], specialSymbols = [], mode = null, bet = 3) {
                this.name = name;
                this.symbols = symbols;
                this.lines = lines;
                this.specialSymbols = specialSymbols;
                this.mode = mode;
                this.bet = bet
            }
        },
        Chip: class {
            constructor(name) {
                this.name = name;
                this.image = null;
            }
            setImage(image) {
                this.image = image;
            }
        },
        Reel: class {
            constructor(chips) {
                this.chips = chips;
                this.length = chips.length
            }
        },
        ChipGroup: class {
            constructor(name, chips) {
                this.name = name;
                this.chips = chips;
            }
        },
        Symbol: class {
            constructor(name, chips, activeModes) {
                this.name = name;
                this.chips = chips;
                this.activeModes
            }
        },
        Mode: class {
            constructor(name) {
                this.name = name;
            }
        },
        SpecialSymbol: class {
            constructor(tags, symbol) {
                this.tags = tags;
                this.symbol = symbol;
            }
        },
        Result: class {
            constructor(controls) {
                this.control = controls
            }
            exportControls(type = 'SlotModuleMk3') {
                switch (type) {
                    case 'SlotModuleMk3':
                        return JSON.stringify(this.control);
                }
            }
        }
    }
    //イメージコード
const Lines = {
    中段: [1, 1, 1],
    上段: [0, 0, 0],
    下段: [2, 2, 2],
    右下がり: [0, 1, 2],
    右上がり: [2, 1, 0]
}
let machine = new SlotControlMaker.Machine([
    Lines.中段
], [
    Lines.中段,
    Lines.上段,
    Lines.下段
], [
    Lines.中段,
    Lines.上段,
    Lines.下段,
    Lines.右上がり,
    Lines.右下がり
]);

const Chips = [
    new SlotControlMaker.Chip('リプレイ'),
    new SlotControlMaker.Chip('ベルA'),
    new SlotControlMaker.Chip('ベルB'),
    new SlotControlMaker.Chip('スイカA'),
    new SlotControlMaker.Chip('スイカB'),
    new SlotControlMaker.Chip('チェリー'),
    new SlotControlMaker.Chip('赤7'),
    new SlotControlMaker.Chip('青7'),
    new SlotControlMaker.Chip('BAR')
]

machine.setChips(Chips)

const ChipGroups = [
    new SlotControlMaker.ChipGroup('ベル', ['ベルA', 'ベルB']),
    new SlotControlMaker.ChipGroup('スイカ', ['スイカA', 'スイカB']),
    new SlotControlMaker.ChipGroup('ボーナス図柄', ['赤7', '青7', 'BAR']),
]

machine.setChipGroups(ChipGroups)

const ReelsChips = [
    ["スイカA", "チェリー", "リプレイ"],
    ["ベルA", "スイカA", "チェリー"],
    ["赤7", "赤7", "赤7"],
    ["リプレイ", "リプレイ", "ベルA"],
    ["スイカB", "ベルA", "スイカA"],
    ["BAR", "チェリー", "リプレイ"],
    ["ベルA", "BAR", "チェリー"],
    ["リプレイ", "リプレイ", "ベルA"],
    ["チェリー", "ベルB", "リプレイ"],
    ["リプレイ", "スイカB", "チェリー"],
    ["ベルA", "チェリー", "BAR"],
    ["青7", "リプレイ", "ベルA"],
    ["リプレイ", "ベルA", "BAR"],
    ["スイカB", "赤7", "リプレイ"],
    ["ベルB", "チェリー", "チェリー"],
    ["リプレイ", "リプレイ", "ベルB"],
    ["スイカB", "ベルA", "スイカA"],
    ["青7", "青7", "リプレイ"],
    ["ベルA", "チェリー", "青7"],
    ["リプレイ", "リプレイ", "ベルA"],
    ["チェリー", "ベルA", "スイカA"]
]

const Reels = [];

for (let i = 0; i < ReelsChips[0].length; i++) {
    Reels.push(new SlotControlMaker.Reel(ReelsChips.map(arr => Chips.find(c => c.name === arr[i]))));
}

machine.setReels(Reels);

const NormalMode = new SlotControlMaker.Mode('Normal');
const BonusMode = new SlotControlMaker.Mode('Bonus');
const JacMode = new SlotControlMaker.Mode('Jac');

machine.addMode(NormalMode);
machine.addMode(BonusMode);
machine.addMode(JacMode);

const Symbols = [
    new SlotControlMaker.Symbol('リプレイ', ['リプレイ', 'リプレイ', 'リプレイ']),
    new SlotControlMaker.Symbol('ベル', ['ベル', 'ベル', 'ベル']),
    new SlotControlMaker.Symbol('ベル', ['ベル', 'ベル', 'BAR']),
    new SlotControlMaker.Symbol('スイカ', ['スイカ', 'スイカ', 'スイカ']),
    new SlotControlMaker.Symbol('チェリー', ['チェリー', null, null]),
    new SlotControlMaker.Symbol('赤7', ['赤7', '赤7', '赤7']),
    new SlotControlMaker.Symbol('青7', ['青7', '青7', '青7']),
    new SlotControlMaker.Symbol('赤BAR', ['BAR', 'BAR', '赤7']),
    new SlotControlMaker.Symbol('青BAR', ['BAR', 'BAR', '青7']),
]

machine.setSymbols(Symbols);

const SpecialSymbols = [
    new SlotControlMaker.SpecialSymbol(['BIG確定'], [2, 2, null]),
    new SlotControlMaker.SpecialSymbol(['小役ハズレ'], [null, null, 0]),
    new SlotControlMaker.SpecialSymbol(['小役ハズレ'], [null, null, 8]),
    new SlotControlMaker.SpecialSymbol(['リーチ目'], [
        ['ボーナス図柄', null, null],
        ['ボーナス図柄', null, null],
        ['ボーナス図柄', null, null]
    ]),
    new SlotControlMaker.SpecialSymbol(['リーチ目'], [
        ['ボーナス図柄', null, null],
        [null, 'ボーナス図柄', null],
        [null, null, 'ボーナス図柄']
    ]),
    new SlotControlMaker.SpecialSymbol(['リーチ目'], [
        [null, 'ボーナス図柄', null],
        [null, 'ボーナス図柄', null],
        [null, 'ボーナス図柄', null]
    ]),
    new SlotControlMaker.SpecialSymbol(['リーチ目'], [
        [null, null, 'ボーナス図柄'],
        [null, 'ボーナス図柄', null],
        ['ボーナス図柄', null, null]
    ]),
    new SlotControlMaker.SpecialSymbol(['リーチ目'], [
        [null, null, 'ボーナス図柄'],
        [null, null, 'ボーナス図柄'],
        [null, null, 'ボーナス図柄']
    ]),
]

machine.setSpecialSymbols(SpecialSymbols);

const Controls = [
    new SlotControlMaker.Control('はずれ'),
    new SlotControlMaker.Control('リプレイ', ['リプレイ'], [Lines.上段, Lines.下段, Lines.中段, Lines.右上がり, Lines.右下がり], ['小役ハズレ']),
    new SlotControlMaker.Control('ベル', ['ベル'], [Lines.上段, Lines.下段, Lines.中段, Lines.右上がり, Lines.右下がり], ['小役ハズレ']),
    new SlotControlMaker.Control('スイカ', ['スイカ'], [Lines.上段, Lines.下段, Lines.中段, Lines.右上がり, Lines.右下がり], ['小役ハズレ']),
    new SlotControlMaker.Control('チェリー', ['チェリー'], [Lines.上段, Lines.下段, Lines.右上がり, Lines.右下がり], ['小役ハズレ']),
    new SlotControlMaker.Control('BIG', ['赤7', '青7'], [Lines.上段, Lines.下段, Lines.中段, Lines.右上がり, Lines.右下がり], ['小役ハズレ', 'リーチ目', 'BIG確定']),
    new SlotControlMaker.Control('REG', ['赤BAR', '青7'], [Lines.上段, Lines.下段, Lines.中段, Lines.右上がり, Lines.右下がり], ['小役ハズレ', 'リーチ目']),
]

machine.setControls(Controls);

let Result = machine.generate();

console.log(Result);