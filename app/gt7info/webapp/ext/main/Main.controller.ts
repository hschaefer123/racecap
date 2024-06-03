import Controller from "sap/fe/core/PageController";

/**
 * @namespace gt7info.ext.main
 */
export default class Main extends Controller {

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created.
     * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
     * @memberOf gt7info.ext.main.Main
     */
    // public onInit(): void {
    //
    //}

    /**
     * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
     * (NOT before the first rendering! onInit() is used for that one!).
     * @memberOf gt7info.ext.main.Main
     */
    // public  onBeforeRendering(): void {
    //
    //  }

    /**
     * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
     * This hook is the same one that SAPUI5 controls get after being rendered.
     * @memberOf gt7info.ext.main.Main
     */
    // public  onAfterRendering(): void {
    //
    //  }

    /**
     * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
     * @memberOf gt7info.ext.main.Main
     */
    // public onExit(): void {
    //
    //  }

    public estimateText(estimatedays: number) {
        const days = (estimatedays) ? estimatedays - 1 : 0;
        if (days === 0) {
            return "Last Day Available"
        } else if (days === 1) {
            return "Available 1 More Day"
        } else {
            return `Available ${days} More Days`
        }
    }
}