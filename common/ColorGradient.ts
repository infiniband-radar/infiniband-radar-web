import { TopologyConnection } from './models/Client/TopologyTreeModels';
import { LinkSpeedConverter } from './LinkSpeedConverter';

export class ColorGradient {
    public static readonly belowThresholdColor = 'rgba(0, 0, 0, 0.4)';
    public static readonly defaultThresholdValue = 0.01; // Triggers when below 1% of max bandwidth

    /**
     * Creates a css color object for both directions of the connection
     * @param connection
     * @param xmitBytes
     * @param rcvBytes
     */
    public static getColorForConnection(connection: TopologyConnection, xmitBytes: number, rcvBytes: number): {
        xmitColor: string,
        rcvColor: string,
    } {
        const xmitUsage = LinkSpeedConverter.getRelativeUsage(connection.link, xmitBytes);
        const rcvUsage = LinkSpeedConverter.getRelativeUsage(connection.link, rcvBytes);
        return {
            xmitColor: this.fromGreenToRedWithThreshold(xmitUsage, ColorGradient.defaultThresholdValue),
            rcvColor: this.fromGreenToRedWithThreshold(rcvUsage, ColorGradient.defaultThresholdValue),
        };
    }

    /**
     * Provide a css color from green to red depending on given value
     * if the value is below the threshold the color will be { ColorGradient.belowThresholdColor }
     * @param {number} relativeValue A value from 0 to 1
     * @param {number} threshold If the value is below the threshold
     * @see ColorGradient.fromGreenToRed
     * @see ColorGradient.belowThresholdColor
     * @returns {string} A css valid color
     */
    public static fromGreenToRedWithThreshold(relativeValue: number, threshold?: number): string {
        if (threshold && relativeValue < threshold) {
            return ColorGradient.belowThresholdColor;
        }

        return ColorGradient.fromGreenToRed(relativeValue);
    }

    /**
     * Provide a css color from green to red depending on given value
     * @param {number} relativeValue A value from 0 to 1
     * @returns {string} A css valid color
     */
    public static fromGreenToRed(relativeValue: number): string {
        // Fast return
        if (relativeValue >= 1) {
            return `rgb(255, 0, 0)`;
        }

        let red = 0;
        let green = 0;
        const blue = 0;

        if (0 <= relativeValue && relativeValue < 0.5) {
            green = 1;
            red = 2 * relativeValue;
        }

        if (0.5 <= relativeValue && relativeValue <= 1) {
            red = 1;
            green = 1 - (2 * (relativeValue - 0.5));
        }

        return `rgb(${Math.floor(red * 255)},${Math.floor(green * 255)},${Math.floor(blue * 255)})`;
    }
}
