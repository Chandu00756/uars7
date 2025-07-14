package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"runtime"
	"sync"

	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/chacha20poly1305"
	"golang.org/x/crypto/scrypt"
)

var (
	masterKey    []byte
	keyDerivator *KeyDerivator
	initOnce     sync.Once
	cleanupOnce  sync.Once
)

const (
	// Key sizes
	AESKeySize    = 32 // AES-256
	ChaChaKeySize = 32 // ChaCha20-Poly1305
	NonceSize     = 12 // GCM/ChaCha20-Poly1305 nonce size
	ScryptN       = 32768
	ScryptR       = 8
	ScryptP       = 1
	ScryptKeyLen  = 32

	// Metadata
	CryptoVersion = 1
	AESMode       = "AES-256-GCM"
	ChaChaMode    = "ChaCha20-Poly1305"
)

type KeyDerivator struct {
	salt []byte
	mu   sync.RWMutex
}

type EncryptedData struct {
	Version   int    `json:"version"`
	Algorithm string `json:"algorithm"`
	Nonce     []byte `json:"nonce"`
	Data      []byte `json:"data"`
	Checksum  []byte `json:"checksum"`
}

// Initialize sets up the crypto subsystem with the master key
func Initialize() error {
	var err error
	initOnce.Do(func() {
		keyHex := os.Getenv("ADCF_KEY")
		if keyHex == "" {
			err = errors.New("ADCF_KEY environment variable is required")
			return
		}

		if len(keyHex) != 64 {
			err = errors.New("ADCF_KEY must be exactly 64 hex characters (32 bytes)")
			return
		}

		masterKey, err = hex.DecodeString(keyHex)
		if err != nil {
			err = fmt.Errorf("invalid ADCF_KEY format: %w", err)
			return
		}

		if len(masterKey) != AESKeySize {
			err = fmt.Errorf("decoded key must be %d bytes, got %d", AESKeySize, len(masterKey))
			return
		}

		// Initialize key derivator with random salt
		salt := make([]byte, 16)
		if _, err = rand.Read(salt); err != nil {
			err = fmt.Errorf("failed to generate salt: %w", err)
			return
		}

		keyDerivator = &KeyDerivator{salt: salt}

		log.Info().
			Str("algorithm", "AES-256-GCM, ChaCha20-Poly1305").
			Msg("Crypto subsystem initialized successfully")
	})

	return err
}

// GenerateID creates a cryptographically secure random ID
func GenerateID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		log.Error().Err(err).Msg("Failed to generate random ID")
		return ""
	}
	return hex.EncodeToString(b)
}

// GenerateLongID creates a longer cryptographically secure random ID
func GenerateLongID() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		log.Error().Err(err).Msg("Failed to generate long random ID")
		return ""
	}
	return hex.EncodeToString(b)
}

// Encrypt encrypts data using AES-256-GCM by default
func Encrypt(data []byte) ([]byte, error) {
	return EncryptWithAlgorithm(data, AESMode)
}

// EncryptWithAlgorithm encrypts data with the specified algorithm
func EncryptWithAlgorithm(data []byte, algorithm string) ([]byte, error) {
	if masterKey == nil {
		return nil, errors.New("crypto not initialized")
	}

	var encrypted *EncryptedData
	var err error

	switch algorithm {
	case AESMode:
		encrypted, err = encryptAES(data)
	case ChaChaMode:
		encrypted, err = encryptChaCha(data)
	default:
		return nil, fmt.Errorf("unsupported algorithm: %s", algorithm)
	}

	if err != nil {
		return nil, err
	}

	// Serialize encrypted data
	return serializeEncryptedData(encrypted)
}

// Decrypt decrypts data, automatically detecting the algorithm
func Decrypt(encryptedData []byte) ([]byte, error) {
	if masterKey == nil {
		return nil, errors.New("crypto not initialized")
	}

	encrypted, err := deserializeEncryptedData(encryptedData)
	if err != nil {
		return nil, err
	}

	switch encrypted.Algorithm {
	case AESMode:
		return decryptAES(encrypted)
	case ChaChaMode:
		return decryptChaCha(encrypted)
	default:
		return nil, fmt.Errorf("unsupported algorithm: %s", encrypted.Algorithm)
	}
}

// encryptAES encrypts data using AES-256-GCM
func encryptAES(data []byte) (*EncryptedData, error) {
	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	ciphertext := gcm.Seal(nil, nonce, data, nil)
	checksum := sha256.Sum256(ciphertext)

	return &EncryptedData{
		Version:   CryptoVersion,
		Algorithm: AESMode,
		Nonce:     nonce,
		Data:      ciphertext,
		Checksum:  checksum[:],
	}, nil
}

// decryptAES decrypts data using AES-256-GCM
func decryptAES(encrypted *EncryptedData) ([]byte, error) {
	// Verify checksum
	checksum := sha256.Sum256(encrypted.Data)
	if subtle.ConstantTimeCompare(checksum[:], encrypted.Checksum) != 1 {
		return nil, errors.New("checksum verification failed")
	}

	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	return gcm.Open(nil, encrypted.Nonce, encrypted.Data, nil)
}

// encryptChaCha encrypts data using ChaCha20-Poly1305
func encryptChaCha(data []byte) (*EncryptedData, error) {
	aead, err := chacha20poly1305.New(masterKey)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	ciphertext := aead.Seal(nil, nonce, data, nil)
	checksum := sha256.Sum256(ciphertext)

	return &EncryptedData{
		Version:   CryptoVersion,
		Algorithm: ChaChaMode,
		Nonce:     nonce,
		Data:      ciphertext,
		Checksum:  checksum[:],
	}, nil
}

// decryptChaCha decrypts data using ChaCha20-Poly1305
func decryptChaCha(encrypted *EncryptedData) ([]byte, error) {
	// Verify checksum
	checksum := sha256.Sum256(encrypted.Data)
	if subtle.ConstantTimeCompare(checksum[:], encrypted.Checksum) != 1 {
		return nil, errors.New("checksum verification failed")
	}

	aead, err := chacha20poly1305.New(masterKey)
	if err != nil {
		return nil, err
	}

	return aead.Open(nil, encrypted.Nonce, encrypted.Data, nil)
}

// DeriveKey derives a key from a password using scrypt
func DeriveKey(password, salt []byte) ([]byte, error) {
	if keyDerivator == nil {
		return nil, errors.New("key derivator not initialized")
	}

	keyDerivator.mu.RLock()
	defer keyDerivator.mu.RUnlock()

	if salt == nil {
		salt = keyDerivator.salt
	}

	return scrypt.Key(password, salt, ScryptN, ScryptR, ScryptP, ScryptKeyLen)
}

// HashData creates a SHA-256 hash of the data
func HashData(data []byte) []byte {
	hash := sha256.Sum256(data)
	return hash[:]
}

// HashHex creates a SHA-256 hash and returns it as hex string
func HashHex(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

// SecureZero securely zeros out memory
func SecureZero(data []byte) {
	for i := range data {
		data[i] = 0
	}
	runtime.GC()
}

// SecureCleanup performs secure cleanup of sensitive data
func SecureCleanup() {
	cleanupOnce.Do(func() {
		if masterKey != nil {
			SecureZero(masterKey)
			masterKey = nil
		}

		if keyDerivator != nil {
			keyDerivator.mu.Lock()
			if keyDerivator.salt != nil {
				SecureZero(keyDerivator.salt)
				keyDerivator.salt = nil
			}
			keyDerivator.mu.Unlock()
			keyDerivator = nil
		}

		runtime.GC()
		log.Info().Msg("Crypto cleanup completed")
	})
}

// serializeEncryptedData converts EncryptedData to bytes
func serializeEncryptedData(data *EncryptedData) ([]byte, error) {
	// Simple binary format: version(1) + algorithm_len(1) + algorithm + nonce_len(1) + nonce + checksum_len(1) + checksum + data
	algorithmBytes := []byte(data.Algorithm)

	result := make([]byte, 0, 4+len(algorithmBytes)+len(data.Nonce)+len(data.Checksum)+len(data.Data))

	// Version (1 byte)
	result = append(result, byte(data.Version))

	// Algorithm length + algorithm
	result = append(result, byte(len(algorithmBytes)))
	result = append(result, algorithmBytes...)

	// Nonce length + nonce
	result = append(result, byte(len(data.Nonce)))
	result = append(result, data.Nonce...)

	// Checksum length + checksum
	result = append(result, byte(len(data.Checksum)))
	result = append(result, data.Checksum...)

	// Data
	result = append(result, data.Data...)

	return result, nil
}

// deserializeEncryptedData converts bytes back to EncryptedData
func deserializeEncryptedData(data []byte) (*EncryptedData, error) {
	if len(data) < 4 {
		return nil, errors.New("invalid encrypted data format")
	}

	offset := 0

	// Version
	version := int(data[offset])
	offset++

	// Algorithm
	algorithmLen := int(data[offset])
	offset++

	if offset+algorithmLen > len(data) {
		return nil, errors.New("invalid algorithm length")
	}

	algorithm := string(data[offset : offset+algorithmLen])
	offset += algorithmLen

	// Nonce
	if offset >= len(data) {
		return nil, errors.New("invalid nonce length position")
	}

	nonceLen := int(data[offset])
	offset++

	if offset+nonceLen > len(data) {
		return nil, errors.New("invalid nonce length")
	}

	nonce := make([]byte, nonceLen)
	copy(nonce, data[offset:offset+nonceLen])
	offset += nonceLen

	// Checksum
	if offset >= len(data) {
		return nil, errors.New("invalid checksum length position")
	}

	checksumLen := int(data[offset])
	offset++

	if offset+checksumLen > len(data) {
		return nil, errors.New("invalid checksum length")
	}

	checksum := make([]byte, checksumLen)
	copy(checksum, data[offset:offset+checksumLen])
	offset += checksumLen

	// Remaining data
	if offset > len(data) {
		return nil, errors.New("invalid data format")
	}

	encryptedBytes := make([]byte, len(data)-offset)
	copy(encryptedBytes, data[offset:])

	return &EncryptedData{
		Version:   version,
		Algorithm: algorithm,
		Nonce:     nonce,
		Data:      encryptedBytes,
		Checksum:  checksum,
	}, nil
}

// ValidateKey validates that a key meets security requirements
func ValidateKey(key []byte) error {
	if len(key) < 32 {
		return errors.New("key must be at least 32 bytes")
	}

	// Check for all zeros
	allZeros := true
	for _, b := range key {
		if b != 0 {
			allZeros = false
			break
		}
	}

	if allZeros {
		return errors.New("key cannot be all zeros")
	}

	return nil
}

// RotateKeys rotates the master key (for key rotation scenarios)
func RotateKeys(newKeyHex string) error {
	newKey, err := hex.DecodeString(newKeyHex)
	if err != nil {
		return fmt.Errorf("invalid new key format: %w", err)
	}

	if err := ValidateKey(newKey); err != nil {
		return fmt.Errorf("new key validation failed: %w", err)
	}

	// Securely replace the master key
	if masterKey != nil {
		SecureZero(masterKey)
	}

	masterKey = make([]byte, len(newKey))
	copy(masterKey, newKey)

	// Clear the new key from memory
	SecureZero(newKey)

	log.Info().Msg("Master key rotated successfully")
	return nil
}
