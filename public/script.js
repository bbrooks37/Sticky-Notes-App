// Get references to DOM elements
const noteTextInput = document.getElementById('note-text');
const addNoteButton = document.getElementById('add-note-btn');
const notesContainer = document.getElementById('notes-container');
const savingIndicator = document.getElementById('saving-indicator');
const searchInput = document.getElementById('search-input');
const noteDueDateInput = document.getElementById('note-due-date');
const noteReminderTimeInput = document.getElementById('note-reminder-time');

// Export/Import Elements
const exportNotesBtn = document.getElementById('export-notes-btn');
const importNotesBtn = document.getElementById('import-notes-btn');
const importNotesInput = document.getElementById('import-notes-input');

// Modal elements
const confirmModal = document.getElementById('confirm-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
let noteIdToDelete = null;

// --- API Endpoint ---
const API_BASE_URL = 'https://pronotes-backend.onrender.com/api/notes';

// --- Drag and Drop State ---
let draggedNote = null;

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
    const date = new Date(dateString + 'T00:00:00');
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
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateString + 'T00:00:00');
    return dueDate < today;
}

/**
 * Determines the color class for a note based on its due date and reminder time.
 * @param {string} dueDateString - The ISO date string (YYYY-MM-DD).
 * @param {string} reminderTime - The time string (HH:MM).
 * @returns {string} A CSS class name for the note color.
 */
function getNoteColorClass(dueDateString, reminderTime) {
    if (!dueDateString) {
        return 'color-default';
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateString + 'T00:00:00');
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = dueDate.getTime() === today.getTime();
    const isOverdue = dueDate < today;
    let isDueTodayButLate = false;

    if (isToday && reminderTime) {
        const [hours, minutes] = reminderTime.split(':').map(Number);
        const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        isDueTodayButLate = reminderDate < now;
    }

    if (isOverdue || isDueTodayButLate) {
        return 'color-overdue';
    } else if (isToday) {
        return 'color-due-today';
    } else if (dueDate.getTime() === tomorrow.getTime()) {
        return 'color-due-tomorrow';
    }

    return 'color-default';
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

// --- Core Application Functions (Updated for API calls) ---

/**
 * Fetches notes from the backend server.
 * @returns {Promise<Array>} An array of note objects.
 */
async function fetchNotes() {
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch notes:', error);
        return [];
    }
}

/**
 * Renders a single sticky note element to the DOM.
 * @param {object} note - The note object to render.
 * @returns {HTMLElement} The created note element.
 */
function renderNote(note) {
    const noteElement = document.createElement('div');
    noteElement.classList.add('sticky-note', 'fade-in');
    noteElement.dataset.id = note.id;
    noteElement.setAttribute('draggable', true);

    if (note.pinned) {
        noteElement.classList.add('pinned');
    }

    const noteColorClass = getNoteColorClass(note.due_date, note.reminder_time);
    noteElement.classList.add(noteColorClass);

    const createdAt = note.created_at || new Date().toISOString();
    const formattedTimestamp = formatNoteTimestamp(createdAt);

    const dueDateDisplay = note.due_date ? formatDueDateDisplay(note.due_date) : '';
    const isOverdue = note.due_date ? isDateOverdue(note.due_date) : false;
    const overdueClass = isOverdue ? 'overdue' : '';

    const reminderTimeDisplay = note.reminder_time ? ` at ${note.reminder_time}` : '';

    noteElement.innerHTML = `
        <button class="pin-btn" aria-label="Pin note">
            <i class="${note.pinned ? 'fas' : 'far'} fa-thumbtack"></i>
        </button>
        <p class="sticky-note-text">${note.text}</p>
        <div class="note-meta">
            <div class="note-timestamp">${formattedTimestamp}</div>
            ${note.due_date ? `<div class="note-due-date ${overdueClass}">Due: ${dueDateDisplay}${reminderTimeDisplay}</div>` : ''}
        </div>
        <button class="delete-btn" aria-label="Delete note"></button>
    `;

    const noteTextElement = noteElement.querySelector('.sticky-note-text');
    const deleteButton = noteElement.querySelector('.delete-btn');
    const pinButton = noteElement.querySelector('.pin-btn');

    deleteButton.addEventListener('click', () => showConfirmModal(note.id));
    pinButton.addEventListener('click', () => togglePinNote(note.id, note.pinned));

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
 * Renders all notes from the server, applying any filters.
 * Includes sorting by due date, pinned status, then creation date.
 * @param {string} [searchTerm=''] - The term to filter notes by.
 */
async function renderAllNotes(searchTerm = '') {
    notesContainer.innerHTML = '';
    const allNotes = await fetchNotes();

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    let filteredNotes = allNotes.filter(note =>
        note.text.toLowerCase().includes(lowerCaseSearchTerm)
    );

    // Grouping and Sorting Logic
    filteredNotes.sort((a, b) => {
        // Pinned notes always come first
        if (a.pinned !== b.pinned) {
            return a.pinned ? -1 : 1;
        }

        // If both are pinned or unpinned, sort by due date
        const dateA = a.due_date ? new Date(a.due_date) : null;
        const dateB = b.due_date ? new Date(b.due_date) : null;

        if (dateA && dateB) {
            return dateA.getTime() - dateB.getTime();
        }
        if (dateA) return -1; // a has due date, b doesn't
        if (dateB) return 1;  // b has due date, a doesn't

        // If neither have a due date, sort by creation date (newest first)
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    filteredNotes.forEach(note => {
        notesContainer.appendChild(renderNote(note));
    });
}

/**
 * Adds a new note to the collection via API call.
 */
async function addNote() {
    const noteText = noteTextInput.value.trim();
    const dueDate = noteDueDateInput.value;
    const reminderTime = noteReminderTimeInput.value;

    if (noteText === '') {
        return;
    }

    const newNote = {
        text: noteText,
        due_date: dueDate || null,
        reminder_time: reminderTime || null
    };

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newNote)
        });

        if (!response.ok) {
            throw new Error('Failed to add note');
        }

        showSavingIndicator('Note added!');
        setTimeout(hideSavingIndicator, 1500);
        await renderAllNotes(searchInput.value);
        noteTextInput.value = '';
        noteDueDateInput.value = '';
        noteReminderTimeInput.value = '';
        toggleAddButtonState();
        noteTextInput.focus();

    } catch (error) {
        console.error('Error adding note:', error);
        alert('Failed to add note. Please try again.');
    }
}

/**
 * Updates properties of an existing note via API call.
 * @param {string} id - The ID of the note to update.
 * @param {object} updates - An object containing properties to update.
 */
async function updateNoteContent(id, updates) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            throw new Error('Failed to update note');
        }

        showSavingIndicator('Note updated!');
        setTimeout(hideSavingIndicator, 1500);
        await renderAllNotes(searchInput.value);
    } catch (error) {
        console.error('Error updating note:', error);
        alert('Failed to update note. Please try again.');
    }
}

/**
 * Toggles the 'pinned' status of a note via API call.
 * @param {string} id - The ID of the note to toggle.
 * @param {boolean} currentPinnedStatus - The current pinned status of the note.
 */
async function togglePinNote(id, currentPinnedStatus) {
    await updateNoteContent(id, { pinned: !currentPinnedStatus });
}

/**
 * Deletes a note from the collection via API call.
 * This is called from the modal confirmation.
 * @param {string} id - The ID of the note to delete.
 */
async function deleteNote(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete note');
        }

        const noteElement = document.querySelector(`.sticky-note[data-id='${id}']`);
        if (noteElement) {
            noteElement.classList.add('fade-out');
            noteElement.addEventListener('animationend', () => {
                noteElement.remove();
            }, {
                once: true
            });
        }
        
        showSavingIndicator('Note deleted!');
        setTimeout(hideSavingIndicator, 1500);
        await renderAllNotes(searchInput.value);
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note. Please try again.');
    } finally {
        hideConfirmModal();
    }
}

// --- NEW: Export/Import Functions (Still using Local Storage for now) ---
// These functions are left as-is, but a future enhancement would involve
// adding backend routes for these operations as well.

function exportNotes() {
    const notes = JSON.parse(localStorage.getItem('stickyNotesApp.notes') || '[]');
    if (notes.length === 0) {
        alert("No notes to export!");
        return;
    }

    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `pronotes_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSavingIndicator("Notes Exported!");
    setTimeout(hideSavingIndicator, 2000);
}

function importNotes() {
    importNotesInput.click();
}

importNotesInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedNotes = JSON.parse(e.target.result);
            if (!Array.isArray(importedNotes) || !importedNotes.every(note => typeof note === 'object' && note !== null && 'id' in note && 'text' in note)) {
                alert("Invalid JSON file format. Please select a valid ProNotes export file.");
                return;
            }

            const mergeOption = confirm("Do you want to merge these notes with your existing notes (OK) or replace all existing notes (Cancel)?");
            
            let finalNotes;
            if (mergeOption) {
                // This would need to be updated for the backend, for now it will just save to localStorage
                const currentNotes = JSON.parse(localStorage.getItem('stickyNotesApp.notes') || '[]');
                const existingNoteIds = new Set(currentNotes.map(note => note.id));
                const newNotesToAdd = importedNotes.filter(importedNote => !existingNoteIds.has(importedNote.id));
                finalNotes = [...currentNotes, ...newNotesToAdd];
            } else {
                finalNotes = importedNotes;
            }

            localStorage.setItem('stickyNotesApp.notes', JSON.stringify(finalNotes));
            await renderAllNotes(searchInput.value);
            alert(`Successfully imported ${importedNotes.length} notes!`);
            showSavingIndicator("Notes Imported!");
            setTimeout(hideSavingIndicator, 2000);
        } catch (error) {
            console.error("Error importing notes:", error);
            alert("Failed to import notes. Please ensure the file is a valid JSON format.");
        } finally {
            importNotesInput.value = '';
        }
    };
    reader.onerror = () => {
        alert("Error reading file.");
        importNotesInput.value = '';
    };
    reader.readAsText(file);
});

// --- Drag and Drop Functions ---
function handleDragStart(e) {
    draggedNote = e.target.closest('.sticky-note');
    if (!draggedNote) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedNote.dataset.id);
    draggedNote.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    const target = e.target.closest('.sticky-note');
    if (target && target !== draggedNote) {
        const rect = target.getBoundingClientRect();
        const isBefore = e.clientY < rect.top + rect.height / 2;
        notesContainer.insertBefore(draggedNote, isBefore ? target : target.nextSibling);
    }
}

async function handleDrop(e) {
    e.preventDefault();
    draggedNote.classList.remove('dragging');
    const newOrder = Array.from(notesContainer.children).map(noteElement => noteElement.dataset.id);
    // Note: The drag and drop functionality here is currently only visual.
    // To make this permanent, you would need a backend route to handle
    // updating the order of all notes in the database.
    // For now, it will simply re-render in the new order after a refresh,
    // but the backend order won't be changed.
    await renderAllNotes();
}

function handleDragEnd(e) {
    draggedNote.classList.remove('dragging');
    draggedNote = null;
}

/**
 * Initializes the application: loads notes and sets up event listeners.
 */
async function initializeApp() {
    await renderAllNotes();

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

    // Drag and Drop Event Listeners
    notesContainer.addEventListener('dragstart', handleDragStart);
    notesContainer.addEventListener('dragover', handleDragOver);
    notesContainer.addEventListener('drop', handleDrop);
    notesContainer.addEventListener('dragend', handleDragEnd);

    // Export/Import button event listeners (still using local storage)
    exportNotesBtn.addEventListener('click', exportNotes);
    importNotesBtn.addEventListener('click', importNotes);

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