const audios = {
    levelUp: 'audio/smb3_1-up.wav',
    pipe: 'audio/smb3_pipe.wav',
    down: 'audio/smb3_player_down.wav',
    fly: 'audio/smb3_pmeter.wav',
    powerUp: 'audio/smb3_power-up.wav',
}

/**
 * Plays an audio source.
 *
 * @param audioSource The audio source to be played.
 * @param loop Boolean whether the audio source is to be looped or not.
 * */
function playAudio(audioSource, loop = false) {
    let audio = new Audio(audioSource)
    audio.loop = loop
    audio.play()
}