const audios = {
    levelUp: 'audio/smb3_1-up.wav',
    pipe: 'audio/smb3_pipe.wav',
    down: 'audio/smb3_player_down.wav',
    fly: 'audio/smb3_pmeter.wav',
    powerUp: 'audio/smb3_power-up.wav',
}

var muted = false

/**
 * Plays an audio source.
 *
 * @param audioSource The audio source to be played.
 * @param loop Boolean whether the audio source is to be looped or not.
 * */
function playAudio(audioSource, loop = false) {
    if (!muted) {
        let audio = new Audio(audioSource)
        audio.loop = loop
        audio.play()
    }
}

/**
 * (Un)Mutes the audio.
 * */
function muteSound() {
    muted = !muted
    if (muted) {
        document.getElementById('sound-mute').innerText = 'Unmute'
    } else {
        document.getElementById('sound-mute').innerText = 'Mute'
    }
}