import yoga from 'yoga-layout';

// Maps CSS style properties to an object of supported CSS keywords, which are then mapped to the yoga-layout constant values
export const YogaConstants = {
  'flex-direction': {
    row: yoga.FLEX_DIRECTION_ROW,
    column: yoga.FLEX_DIRECTION_COLUMN
  },
  'justify-content': {
    'space-between': yoga.JUSTIFY_SPACE_BETWEEN,
    'flex-start': yoga.JUSTIFY_FLEX_START,
    'flex-end': yoga.JUSTIFY_FLEX_END,
    center: yoga.JUSTIFY_CENTER
  },
  'align-items': {
    'flex-start': yoga.ALIGN_FLEX_START,
    'flex-end': yoga.ALIGN_FLEX_END,
    center: yoga.ALIGN_CENTER,
    stretch: yoga.ALIGN_STRETCH
  },
    'align-self': {
        'flex-start': yoga.ALIGN_FLEX_START,
        'flex-end': yoga.ALIGN_FLEX_END,
        center: yoga.ALIGN_CENTER,
        stretch: yoga.ALIGN_STRETCH
    },
    'flex-wrap': {
        nowrap: yoga.WRAP_NO_WRAP,
        wrap: yoga.WRAP_WRAP,
        'wrap-reverse': yoga.WRAP_WRAP_REVERSE
    },
    'align-content': {
        'flex-start': yoga.ALIGN_FLEX_START,
        'flex-end': yoga.ALIGN_FLEX_END,
        center: yoga.ALIGN_CENTER,
        stretch: yoga.ALIGN_STRETCH,
        'space-between': yoga.ALIGN_SPACE_BETWEEN,
        'space-around': yoga.ALIGN_SPACE_AROUND
    }
    'position': {
        'absolute': yoga.POSITION_TYPE_ABSOLUTE,
        'relative': yoga.POSITION_TYPE_RELATIVE
    },
    'overflow': {
        'visible': yoga.OVERFLOW_VISIBLE,
        'hidden': yoga.OVERFLOW_HIDDEN,
        'scroll': yoga.OVERFLOW_SCROLL
    },
    'display': {
        'flex': yoga.DISPLAY_FLEX,
        'none': yoga.DISPLAY_NONE
    },
    'flex-grow': {
        '0': 0,
        '1': 1
    },
    'flex-shrink': {
        '0': 0,
        '1': 1
    }
};
