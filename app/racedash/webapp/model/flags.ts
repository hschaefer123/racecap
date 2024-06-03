/* Usage
** let flags = SimulatorFlags.CarOnTrack | !SimulatorFlags.LoadingOrProcessing; // (0001 | 0100) === 0101
**
** if ((flags & flags.CarOnTrack) === SimulatorFlags.CarOnTrack) {...}
*/

export enum SimulatorFlags {
    /*
    None = 0,
    Friendly = 1 << 0, // 0001 -- the bitshift is unnecessary, but done for consistency
    Mean = 1 << 1,     // 0010
    Funny = 1 << 2,    // 0100
    Boring = 1 << 3,   // 1000
    All = ~(~0 << 4)   // 1111
    */

    None = 0,                       // 00000000000

    /// <summary>
    /// The car is on the track or paddock, with data available.
    /// </summary>  
    CarOnTrack = 1 << 0,            // 00000000001

    /// <summary>
    /// The game's simulation is paused. 
    /// Note: The simulation will not be paused while in the pause menu in online modes.
    /// </summary>
    Paused = 1 << 1,                // 00000000010

    /// <summary>
    /// Track or car is currently being loaded onto the track.
    /// </summary>
    LoadingOrProcessing = 1 << 2,   // 00000000100

    /// <summary>
    /// Needs more investigation
    /// </summary>
    InGear = 1 << 3,

    /// <summary>
    /// Current car has a Turbo.
    /// </summary>
    HasTurbo = 1 << 4,

    /// <summary>
    /// Rev Limiting is active.
    /// </summary>
    RevLimiterBlinkAlertActive = 1 << 5,

    /// <summary>
    /// Hand Brake is active.
    /// </summary>
    HandBrakeActive = 1 << 6,

    /// <summary>
    /// Lights are active.
    /// </summary>
    LightsActive = 1 << 7,

    /// <summary>
    /// High Beams are turned on.
    /// </summary>
    HighBeamActive = 1 << 8,

    /// <summary>
    /// Low Beams are turned on.
    /// </summary>
    LowBeamActive = 1 << 9,

    /// <summary>
    /// ASM is active.
    /// </summary>
    ASMActive = 1 << 10,

    /// <summary>
    /// Traction Control is active.
    /// </summary>
    TCSActive = 1 << 11,
}
