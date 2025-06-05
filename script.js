// Get references to DOM elements
const noteTextInput = document.getElementById('note-text');
const addNoteButton = document.getElementById('add-note-btn');
const notesContainer = document.getElementById('notes-container');
const savingIndicator = document.getElementById('saving-indicator'); // For global saving feedback
const searchInput = document.getElementById('search-input'); // Search input element
const noteDueDateInput = document.getElementById('note-due-date'); // Due Date input

// NEW: Export/Import Elements
const exportNotesBtn = document.getElementById('export-notes-btn');
const importNotesBtn = document.getElementById('import-notes-btn');
const importNotesInput = document.getElementById('import-notes-input'); // Hidden file input

// Modal elements
const confirmModal = document.getElementById('confirm-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
let noteIdToDelete = null; // To store the ID of the note currently being confirmed for deletion

// Key for local storage
const LOCAL_STORAGE_KEY = 'stickyNotesApp.notes';

// --- Helper Functions ---

/**
 * Formats a date string into a human-readable format.
 * @param {string} dateString - The ISO date string (e.g., from new Date().toISOString()).
 * @returns {string} Formatted date and time string.
 */
function formatNoteTimestamp(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return date.toLocaleString(undefined, options);
}

/**
 * Formats a due date string for display.
 * @param {string} dateString - The ISO date string (YYYY-MM-DD).
 * @returns {string} Formatted date string (e.g., "Jun 3, 2025").
 */
function formatDueDateDisplay(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Add T00:00:00 to avoid timezone issues for simple dates
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return date.toLocaleDateString(undefined, options);
}

/**
 * Checks if a given due date is in the past (overdue).
 * @param {string} dueDateString - The ISO date string (YYYY-MM-DD).
 * @returns {boolean} True if the date is in the past, false otherwise.
 */
function isDateOverdue(dueDateString) {
    if (!dueDateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today for comparison
    const dueDate = new Date(dueDateString + 'T00:00:00'); // Ensure comparison is at start of day
    return dueDate < today;
}


/**
 * Shows a temporary saving indicator.
 * @param {string} message - The message to display.
 */
function showSavingIndicator(message = "Saved!") {
    if (savingIndicator) {
        savingIndicator.textContent = message;
        savingIndicator.style.opacity = '1';
        savingIndicator.style.transform = 'translateY(0)';
    }
}

/**
 * Hides the saving indicator after a delay.
 */
function hideSavingIndicator() {
    if (savingIndicator) {
        savingIndicator.style.opacity = '0';
        savingIndicator.style.transform = 'translateY(-10px)';
        setTimeout(() => savingIndicator.textContent = '', 300);
    }
}

/**
 * Toggles the disabled state of the Add Note button based on textarea content.
 */
function toggleAddButtonState() {
    addNoteButton.disabled = noteTextInput.value.trim() === '';
}

// --- Modal Functions ---

/**
 * Shows the custom confirmation modal for a given note ID.
 * @param {string} noteId - The ID of the note to be deleted.
 */
function showConfirmModal(noteId) {
    noteIdToDelete = noteId;
    confirmModal.classList.add('active');
    confirmDeleteBtn.focus();
}

/**
 * Hides the custom confirmation modal.
 */
function hideConfirmModal() {
    confirmModal.classList.remove('active');
    noteIdToDelete = null;
}

// --- Core Application Functions ---

/**
 * Loads notes from local storage.
 * @returns {Array} An array of note objects.
 */
function loadNotes() {
    const notesJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
    return notesJSON ? JSON.parse(notesJSON) : [];
}

/**
 * Saves the current array of notes to local storage.
 * @param {Array} notes - The array of note objects to save.
 */
function saveNotes(notes) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    showSavingIndicator("Saved!");
    setTimeout(hideSavingIndicator, 1500);
}

/**
 * Renders a single sticky note element to the DOM.
 * @param {object} note - The note object to render.
 * @returns {HTMLElement} The created note element.
 */
function renderNote(note) {
    const noteElement = document.createElement('div');
    noteElement.classList.add('sticky-note');
    noteElement.dataset.id = note.id;

    if (note.pinned) {
        noteElement.classList.add('pinned');
    }

    const createdAt = note.createdAt || new Date().toISOString();
    const formattedTimestamp = formatNoteTimestamp(createdAt);

    const dueDateDisplay = note.dueDate ? formatDueDateDisplay(note.dueDate) : '';
    const isOverdue = note.dueDate ? isDateOverdue(note.dueDate) : false;
    const overdueClass = isOverdue ? 'overdue' : '';

    noteElement.innerHTML = `
        <button class="pin-btn" aria-label="Pin note">
            <i class="${note.pinned ? 'fas' : 'far'} fa-thumbtack"></i>
        </button>
        <p class="sticky-note-text">${note.text}</p>
        <div class="note-meta">
            <div class="note-timestamp">${formattedTimestamp}</div>
            ${note.dueDate ? `<div class="note-due-date ${overdueClass}">Due: ${dueDateDisplay}</div>` : ''}
        </div>
        <button class="delete-btn" aria-label="Delete note"></button>
    `;

    const noteTextElement = noteElement.querySelector('.sticky-note-text');
    const deleteButton = noteElement.querySelector('.delete-btn');
    const pinButton = noteElement.querySelector('.pin-btn');

    deleteButton.addEventListener('click', () => showConfirmModal(note.id));
    pinButton.addEventListener('click', () => togglePinNote(note.id));

    noteTextElement.addEventListener('dblclick', () => {
        noteTextElement.contentEditable = 'true';
        noteTextElement.classList.add('editing');
        noteTextElement.focus();
        const range = document.createRange();
        range.selectNodeContents(noteTextElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    });

    noteTextElement.addEventListener('blur', () => {
        noteTextElement.contentEditable = 'false';
        noteTextElement.classList.remove('editing');
        const newText = noteTextElement.textContent.trim();

        if (newText !== note.text) {
            updateNoteContent(note.id, { text: newText });
        }
    });

    noteTextElement.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            noteTextElement.blur();
        }
    });

    return noteElement;
}

/**
 * Renders all notes from the current state, applying any filters.
 * Includes sorting by pinned status then creation date.
 * @param {string} [searchTerm=''] - The term to filter notes by.
 */
function renderAllNotes(searchTerm = '') {
    notesContainer.innerHTML = ''; // Clear existing notes

    let notes = loadNotes();

    // Filter notes based on search term first
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    let filteredNotes = notes.filter(note =>
        note.text.toLowerCase().includes(lowerCaseSearchTerm)
    );

    // Separate pinned and unpinned notes
    const pinnedNotes = filteredNotes.filter(note => note.pinned);
    const unpinnedNotes = filteredNotes.filter(note => !note.pinned);

    // Sort pinned notes by creation date (latest first within pinned group)
    pinnedNotes.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Sort unpinned notes by creation date (latest first within unpinned group)
    unpinnedNotes.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Concatenate pinned notes (all at top) with unpinned notes
    const sortedNotes = [...pinnedNotes, ...unpinnedNotes];

    sortedNotes.forEach(note => {
        notesContainer.appendChild(renderNote(note));
    });
}


/**
 * Adds a new note to the collection and updates storage/UI.
 */
function addNote() {
    const noteText = noteTextInput.value.trim();
    const dueDate = noteDueDateInput.value;

    if (noteText === '') {
        return;
    }

    const newNote = {
        id: Date.now().toString(),
        text: noteText,
        createdAt: new Date().toISOString(),
        pinned: false,
        dueDate: dueDate || null
    };

    const notes = loadNotes();
    notes.push(newNote);
    saveNotes(notes);

    renderAllNotes(searchInput.value);
    noteTextInput.value = '';
    noteDueDateInput.value = '';
    toggleAddButtonState();
    noteTextInput.focus();
}

/**
 * Updates properties of an existing note and saves to local storage.
 * @param {string} id - The ID of the note to update.
 * @param {object} updates - An object containing properties to update (e.g., { text: 'new text', pinned: true }).
 */
function updateNoteContent(id, updates) {
    let notes = loadNotes();
    const noteIndex = notes.findIndex(note => note.id === id);

    if (noteIndex !== -1) {
        notes[noteIndex] = { ...notes[noteIndex], ...updates };
        saveNotes(notes);
        renderAllNotes(searchInput.value);
    }
}

/**
 * Toggles the 'pinned' status of a note.
 * @param {string} id - The ID of the note to toggle.
 */
function togglePinNote(id) {
    let notes = loadNotes();
    const noteIndex = notes.findIndex(note => note.id === id);

    if (noteIndex !== -1) {
        const currentPinnedStatus = notes[noteIndex].pinned || false;
        updateNoteContent(id, { pinned: !currentPinnedStatus });
    }
}


/**
 * Deletes a note from the collection and updates storage/UI.
 * This is called from the modal confirmation.
 * @param {string} id - The ID of the note to delete.
 */
function deleteNote(id) {
    let notes = loadNotes();
    notes = notes.filter(note => note.id !== id);
    saveNotes(notes);
    hideConfirmModal();
    renderAllNotes(searchInput.value);
}

// --- NEW: Export/Import Functions ---

/**
 * Exports all notes to a JSON file.
 */
function exportNotes() {
    const notes = loadNotes();
    if (notes.length === 0) {
        alert("No notes to export!");
        return;
    }

    const dataStr = JSON.stringify(notes, null, 2); // null, 2 for pretty printing
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `pronotes_export_${new Date().toISOString().split('T')[0]}.json`; // e.g., pronotes_export_2025-06-03.json
    document.body.appendChild(a); // Required for Firefox
    a.click();
    document.body.removeChild(a); // Clean up
    URL.revokeObjectURL(url); // Release the object URL

    showSavingIndicator("Notes Exported!");
    setTimeout(hideSavingIndicator, 2000);
}

/**
 * Imports notes from a selected JSON file.
 * Provides an option to merge with existing notes or replace them.
 */
function importNotes() {
    // Programmatically click the hidden file input
    importNotesInput.click();
}

// Event listener for when a file is selected
importNotesInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        return; // No file selected
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const importedNotes = JSON.parse(e.target.result);

            // Basic validation to ensure it's an array of objects
            if (!Array.isArray(importedNotes) || !importedNotes.every(note => typeof note === 'object' && note !== null && 'id' in note && 'text' in note)) {
                alert("Invalid JSON file format. Please select a valid ProNotes export file.");
                return;
            }

            const currentNotes = loadNotes();
            const mergeOption = confirm("Do you want to merge these notes with your existing notes (OK) or replace all existing notes (Cancel)?");

            let finalNotes;
            if (mergeOption) {
                // Merge logic: Add new notes, update existing ones based on ID, avoid duplicates
                const existingNoteIds = new Set(currentNotes.map(note => note.id));
                const newNotesToAdd = importedNotes.filter(importedNote => !existingNoteIds.has(importedNote.id));

                // Optional: Update existing notes if IDs match (could be complex, keeping simple for now)
                // For simplicity, we'll just add new ones and not overwrite existing IDs from import
                finalNotes = [...currentNotes, ...newNotesToAdd];

                // If you want to *overwrite* existing notes with matching IDs from the import:
                // let mergedMap = new Map(currentNotes.map(note => [note.id, note]));
                // importedNotes.forEach(importedNote => mergedMap.set(importedNote.id, importedNote));
                // finalNotes = Array.from(mergedMap.values());

            } else {
                // Replace logic: Completely overwrite existing notes
                finalNotes = importedNotes;
            }

            saveNotes(finalNotes);
            renderAllNotes(searchInput.value);
            alert(`Successfully imported ${importedNotes.length} notes!`);
            showSavingIndicator("Notes Imported!");
            setTimeout(hideSavingIndicator, 2000);

        } catch (error) {
            console.error("Error importing notes:", error);
            alert("Failed to import notes. Please ensure the file is a valid JSON format.");
        } finally {
            // Clear the input value so that selecting the same file again triggers 'change' event
            importNotesInput.value = '';
        }
    };

    reader.onerror = () => {
        alert("Error reading file.");
        importNotesInput.value = '';
    };

    reader.readAsText(file);
});


/**
 * Initializes the application: loads notes and sets up event listeners.
 */
function initializeApp() {
    renderAllNotes(); // Initial render of all notes

    // Add event listeners
    addNoteButton.addEventListener('click', addNote);
    noteTextInput.addEventListener('input', toggleAddButtonState);
    noteTextInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            addNote();
        }
    });
    searchInput.addEventListener('input', () => {
        renderAllNotes(searchInput.value);
    });

    // NEW: Export/Import button event listeners
    exportNotesBtn.addEventListener('click', exportNotes);
    importNotesBtn.addEventListener('click', importNotes); // This triggers the hidden input's click

    // Modal event listeners
    confirmDeleteBtn.addEventListener('click', () => {
        if (noteIdToDelete) {
            deleteNote(noteIdToDelete);
        }
    });
    cancelDeleteBtn.addEventListener('click', hideConfirmModal);
    confirmModal.addEventListener('click', (event) => {
        if (event.target === confirmModal) {
            hideConfirmModal();
        }
    });

    toggleAddButtonState();
}

// --- Initialize the app when the DOM is fully loaded ---
document.addEventListener('DOMContentLoaded', initializeApp);