/**
 * Handles errors.
 *
 * @param error Error to be handled.
 * */
function handleError(error) {
    document.getElementById('error').innerText = error.message
}

/**
 * Clears error messages.
 * */
function clearError() {
    document.getElementById('error').innerText = ''
}