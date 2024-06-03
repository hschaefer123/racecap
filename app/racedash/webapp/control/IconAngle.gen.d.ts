import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./IconAngle" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $IconAngleSettings extends $ControlSettings {
        angle?: string | PropertyBindingInfo;
    }

    export default interface IconAngle {

        // property: angle
        getAngle(): string;
        setAngle(angle: string): this;
    }
}
