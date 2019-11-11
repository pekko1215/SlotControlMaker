//制御を司るクラス
const SlotControlMaker = {
    Machine: class {
        //ベット可能枚数や、有効ラインについて定義する。
        constructor(bet1, bet2, bet3) {
            this.modes = [];
            this.betLines = [bet1, bet2, bet3];
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
    },
    //制御コードに対応する
    Control: class {},
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
        }
    },
    ChipGroup: class {
        constructor(name, chips) {
            this.name = name;
            this.chips = chips;
        }
    },
    Symbol: class {
        constructor(name, chips) {
            this.name = name;
            this.chips = chips;
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
    }
}

//イメージコード

let machine = new SlotControlMaker.Machine([
    [1, 1, 1]
], [
    [0, 0, 0],
    [2, 2, 2]
], [
    [0, 1, 2],
    [2, 1, 0]
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