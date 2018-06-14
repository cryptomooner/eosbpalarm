const audios = {
    levelUp: 'audio/smb3_1-up.wav',
    down: 'audio/smb3_pipe.wav',
    fly: 'audio/smb3_pmeter.wav',
    powerUp: 'audio/smb3_power-up.wav',
    standby: 'audio/smb_mariodie.wav'
}

var muted = false
var audio
/**
 * Plays an audio source.
 *
 * @param audioSource The audio source to be played.
 * @param loop Boolean whether the audio source is to be looped or not.
 * */
function playAudio(audioSource, loop = false) {
    if (!muted) {
        audio = new Audio(audioSource)
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
        audio.pause()
    } else {
        document.getElementById('sound-mute').innerText = 'Mute'
        if(audio.loop === true){
            audio.play()
        }
    }
}