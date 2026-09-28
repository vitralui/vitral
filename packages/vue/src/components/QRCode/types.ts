import type { BaseProps } from '../../base/types';

export interface QRCodeProps extends BaseProps {
    /** What the code says: a link, a Wi-Fi setting, any text. */
    value: string;
    /**
     * How much of the code can be lost and still read: `L` 7%, `M` 15%, `Q`
     * 25%, `H` 30%. Defaults to `M`, and to `H` with an `image` over it.
     */
    ecc?: 'L' | 'M' | 'Q' | 'H';
    /** Light squares around the code, which a reader needs to find it. Defaults to 4. */
    margin?: number;
    /** Any CSS length; the theme's (`10rem`) otherwise. */
    size?: string;
    /** The dark squares' colour. Keep it darker than `background`, or phones will not read it. */
    color?: string;
    background?: string;
    /** A logo in the middle. */
    image?: string;
    /** The logo's width, as a share of the code's. Defaults to 0.22. */
    imageSize?: number;
    /** Names the code for a screen reader; the value it holds otherwise. */
    label?: string;
}
