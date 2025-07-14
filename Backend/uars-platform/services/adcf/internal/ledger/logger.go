package ledger

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type Entry struct {
	ID        string                 `json:"id"`
	Timestamp time.Time              `json:"timestamp"`
	CapsuleID string                 `json:"capsule_id"`
	Action    string                 `json:"action"`
	ActorID   string                 `json:"actor_id"`
	Hash      string                 `json:"hash"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
	Signature string                 `json:"signature,omitempty"`
}

type WALProcessor struct {
	walDir      string
	entries     chan Entry
	ctx         context.Context
	mu          sync.Mutex
	currentFile *os.File
}

var (
	processor *WALProcessor
	initOnce  sync.Once
)

const (
	WALDir        = "/data/adcf/wal"
	MaxFileSize   = 100 * 1024 * 1024 // 100MB
	FlushInterval = 5 * time.Second
)

// Initialize sets up the ledger subsystem
func Initialize() error {
	var err error
	initOnce.Do(func() {
		// Create WAL directory
		if err = os.MkdirAll(WALDir, 0700); err != nil {
			err = fmt.Errorf("failed to create WAL directory: %w", err)
			return
		}

		processor = &WALProcessor{
			walDir:  WALDir,
			entries: make(chan Entry, 1000),
		}
	})

	return err
}

// StartWALProcessor starts the Write-Ahead Log processor
func StartWALProcessor(ctx context.Context) {
	if processor == nil {
		return
	}

	processor.ctx = ctx

	// Start processing entries
	go processor.processEntries()

	// Start periodic file rotation
	go processor.rotateFiles()
}

// Log adds an entry to the ledger
func Log(entry Entry) {
	if processor == nil {
		return
	}

	// Generate ID if not provided
	if entry.ID == "" {
		entry.ID = generateEntryID()
	}

	// Set timestamp if not provided
	if entry.Timestamp.IsZero() {
		entry.Timestamp = time.Now().UTC()
	}

	// Calculate hash if not provided
	if entry.Hash == "" && entry.CapsuleID != "" {
		entry.Hash = calculateHash(entry)
	}

	select {
	case processor.entries <- entry:
		// Entry queued successfully
	case <-processor.ctx.Done():
		// Context cancelled
		return
	default:
		// Channel full, entry dropped (in production, this should trigger alerts)
	}
}

// processEntries processes ledger entries from the channel
func (w *WALProcessor) processEntries() {
	ticker := time.NewTicker(FlushInterval)
	defer ticker.Stop()

	var batch []Entry

	for {
		select {
		case <-w.ctx.Done():
			// Process remaining entries before shutdown
			if len(batch) > 0 {
				w.writeBatch(batch)
			}
			w.closeCurrentFile()
			return

		case entry := <-w.entries:
			batch = append(batch, entry)

			// Write batch if it gets too large
			if len(batch) >= 100 {
				w.writeBatch(batch)
				batch = batch[:0]
			}

		case <-ticker.C:
			// Periodic flush
			if len(batch) > 0 {
				w.writeBatch(batch)
				batch = batch[:0]
			}
		}
	}
}

// writeBatch writes a batch of entries to the WAL file
func (w *WALProcessor) writeBatch(entries []Entry) {
	w.mu.Lock()
	defer w.mu.Unlock()

	// Ensure we have a current file
	if err := w.ensureCurrentFile(); err != nil {
		return
	}

	for _, entry := range entries {
		data, err := json.Marshal(entry)
		if err != nil {
			continue
		}

		// Write entry with newline
		if _, err := w.currentFile.Write(append(data, '\n')); err != nil {
			return
		}
	}

	// Sync to disk
	w.currentFile.Sync()
}

// ensureCurrentFile ensures there's a current WAL file open for writing
func (w *WALProcessor) ensureCurrentFile() error {
	now := time.Now().UTC()
	filename := filepath.Join(w.walDir, fmt.Sprintf("%s.wal", now.Format("2006-01-02-15")))

	// Check if we need to open a new file
	if w.currentFile == nil {
		return w.openNewFile(filename)
	}

	// Check if current file is too large
	stat, err := w.currentFile.Stat()
	if err != nil {
		w.closeCurrentFile()
		return w.openNewFile(filename)
	}

	if stat.Size() > MaxFileSize {
		w.closeCurrentFile()
		return w.openNewFile(filename)
	}

	// Check if we need to rotate to a new hour
	currentFilename := filepath.Base(w.currentFile.Name())
	expectedFilename := filepath.Base(filename)
	if currentFilename != expectedFilename {
		w.closeCurrentFile()
		return w.openNewFile(filename)
	}

	return nil
}

// openNewFile opens a new WAL file for writing
func (w *WALProcessor) openNewFile(filename string) error {
	file, err := os.OpenFile(filename, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0600)
	if err != nil {
		return fmt.Errorf("failed to open WAL file %s: %w", filename, err)
	}

	w.currentFile = file
	return nil
}

// closeCurrentFile closes the current WAL file
func (w *WALProcessor) closeCurrentFile() {
	if w.currentFile != nil {
		w.currentFile.Close()
		w.currentFile = nil
	}
}

// rotateFiles handles periodic file rotation and cleanup
func (w *WALProcessor) rotateFiles() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-w.ctx.Done():
			return
		case <-ticker.C:
			w.cleanupOldFiles()
		}
	}
}

// cleanupOldFiles removes WAL files older than the retention period
func (w *WALProcessor) cleanupOldFiles() {
	w.mu.Lock()
	defer w.mu.Unlock()

	// Keep files for 30 days
	cutoff := time.Now().UTC().AddDate(0, 0, -30)

	files, err := filepath.Glob(filepath.Join(w.walDir, "*.wal"))
	if err != nil {
		return
	}

	for _, file := range files {
		stat, err := os.Stat(file)
		if err != nil {
			continue
		}

		if stat.ModTime().Before(cutoff) {
			// Archive file before deletion (in production, this would go to S3)
			w.archiveFile(file)
			os.Remove(file)
		}
	}
}

// archiveFile archives a WAL file (placeholder for S3 upload)
func (w *WALProcessor) archiveFile(filename string) {
	// In production, this would compress and upload to S3
	// For now, we just log the action
}

// calculateHash calculates a hash for a ledger entry
func calculateHash(entry Entry) string {
	data := fmt.Sprintf("%s-%s-%s-%s", entry.CapsuleID, entry.Action, entry.ActorID, entry.Timestamp.Format(time.RFC3339Nano))
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// Query represents a ledger query
type Query struct {
	CapsuleID string    `json:"capsule_id,omitempty"`
	Action    string    `json:"action,omitempty"`
	ActorID   string    `json:"actor_id,omitempty"`
	StartTime time.Time `json:"start_time,omitempty"`
	EndTime   time.Time `json:"end_time,omitempty"`
	Limit     int       `json:"limit,omitempty"`
}

// QueryEntries queries ledger entries
func QueryEntries(query Query) ([]Entry, error) {
	if processor == nil {
		return nil, fmt.Errorf("ledger not initialized")
	}

	// Set default limit
	if query.Limit <= 0 || query.Limit > 1000 {
		query.Limit = 100
	}

	// For now, this is a simple file-based query
	// In production, this would query from a database or search index

	var entries []Entry

	// Get list of WAL files to search
	files, err := filepath.Glob(filepath.Join(processor.walDir, "*.wal"))
	if err != nil {
		return nil, fmt.Errorf("failed to list WAL files: %w", err)
	}

	for _, file := range files {
		fileEntries, err := queryFile(file, query)
		if err != nil {
			continue
		}

		entries = append(entries, fileEntries...)

		if len(entries) >= query.Limit {
			break
		}
	}

	// Trim to limit
	if len(entries) > query.Limit {
		entries = entries[:query.Limit]
	}

	return entries, nil
}

// queryFile queries entries from a single WAL file
func queryFile(filename string, query Query) ([]Entry, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var entries []Entry
	decoder := json.NewDecoder(file)

	for decoder.More() {
		var entry Entry
		if err := decoder.Decode(&entry); err != nil {
			continue
		}

		if matchesQuery(entry, query) {
			entries = append(entries, entry)
		}
	}

	return entries, nil
}

// matchesQuery checks if an entry matches the query criteria
func matchesQuery(entry Entry, query Query) bool {
	if query.CapsuleID != "" && entry.CapsuleID != query.CapsuleID {
		return false
	}

	if query.Action != "" && entry.Action != query.Action {
		return false
	}

	if query.ActorID != "" && entry.ActorID != query.ActorID {
		return false
	}

	if !query.StartTime.IsZero() && entry.Timestamp.Before(query.StartTime) {
		return false
	}

	if !query.EndTime.IsZero() && entry.Timestamp.After(query.EndTime) {
		return false
	}

	return true
}

// GetStats returns ledger statistics
func GetStats() map[string]interface{} {
	if processor == nil {
		return map[string]interface{}{
			"initialized": false,
		}
	}

	processor.mu.Lock()
	defer processor.mu.Unlock()

	stats := map[string]interface{}{
		"initialized": true,
		"wal_dir":     processor.walDir,
		"queue_size":  len(processor.entries),
	}

	// Count WAL files
	files, err := filepath.Glob(filepath.Join(processor.walDir, "*.wal"))
	if err == nil {
		stats["wal_files"] = len(files)

		var totalSize int64
		for _, file := range files {
			if stat, err := os.Stat(file); err == nil {
				totalSize += stat.Size()
			}
		}
		stats["total_size_bytes"] = totalSize
	}

	return stats
}
