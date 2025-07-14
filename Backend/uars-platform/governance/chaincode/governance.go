package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// GovernanceContract defines the smart contract for UARS-7 governance
type GovernanceContract struct {
	contractapi.Contract
}

// Proposal represents a governance proposal
type Proposal struct {
	ID           string            `json:"id"`
	Title        string            `json:"title"`
	Description  string            `json:"description"`
	Proposer     string            `json:"proposer"`
	Type         string            `json:"type"`
	Data         map[string]string `json:"data"`
	Status       string            `json:"status"`
	VotesFor     int               `json:"votes_for"`
	VotesAgainst int               `json:"votes_against"`
	VotesAbstain int               `json:"votes_abstain"`
	CreatedAt    time.Time         `json:"created_at"`
	VotingEnds   time.Time         `json:"voting_ends"`
}

// Vote represents a vote on a proposal
type Vote struct {
	ProposalID string    `json:"proposal_id"`
	Voter      string    `json:"voter"`
	Choice     string    `json:"choice"` // "for", "against", "abstain"
	Timestamp  time.Time `json:"timestamp"`
}

// CreateProposal creates a new governance proposal
func (g *GovernanceContract) CreateProposal(ctx contractapi.TransactionContextInterface,
	proposalID, title, description, proposer, proposalType string,
	data map[string]string, votingDurationHours int) error {

	// Check if proposal already exists
	existing, err := ctx.GetStub().GetState(proposalID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("proposal %s already exists", proposalID)
	}

	// Create proposal
	proposal := Proposal{
		ID:           proposalID,
		Title:        title,
		Description:  description,
		Proposer:     proposer,
		Type:         proposalType,
		Data:         data,
		Status:       "active",
		VotesFor:     0,
		VotesAgainst: 0,
		VotesAbstain: 0,
		CreatedAt:    time.Now(),
		VotingEnds:   time.Now().Add(time.Duration(votingDurationHours) * time.Hour),
	}

	proposalJSON, err := json.Marshal(proposal)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(proposalID, proposalJSON)
}

// Vote casts a vote on a proposal
func (g *GovernanceContract) Vote(ctx contractapi.TransactionContextInterface,
	proposalID, voter, choice string) error {

	// Validate choice
	if choice != "for" && choice != "against" && choice != "abstain" {
		return fmt.Errorf("invalid vote choice: %s", choice)
	}

	// Get proposal
	proposalJSON, err := ctx.GetStub().GetState(proposalID)
	if err != nil {
		return fmt.Errorf("failed to read proposal: %v", err)
	}
	if proposalJSON == nil {
		return fmt.Errorf("proposal %s does not exist", proposalID)
	}

	var proposal Proposal
	err = json.Unmarshal(proposalJSON, &proposal)
	if err != nil {
		return err
	}

	// Check if voting period has ended
	if time.Now().After(proposal.VotingEnds) {
		return fmt.Errorf("voting period for proposal %s has ended", proposalID)
	}

	// Check if proposal is active
	if proposal.Status != "active" {
		return fmt.Errorf("proposal %s is not active", proposalID)
	}

	// Check if voter has already voted
	voteKey := fmt.Sprintf("vote_%s_%s", proposalID, voter)
	existingVote, err := ctx.GetStub().GetState(voteKey)
	if err != nil {
		return fmt.Errorf("failed to check existing vote: %v", err)
	}
	if existingVote != nil {
		return fmt.Errorf("voter %s has already voted on proposal %s", voter, proposalID)
	}

	// Create vote record
	vote := Vote{
		ProposalID: proposalID,
		Voter:      voter,
		Choice:     choice,
		Timestamp:  time.Now(),
	}

	voteJSON, err := json.Marshal(vote)
	if err != nil {
		return err
	}

	// Store vote
	err = ctx.GetStub().PutState(voteKey, voteJSON)
	if err != nil {
		return err
	}

	// Update proposal vote counts
	switch choice {
	case "for":
		proposal.VotesFor++
	case "against":
		proposal.VotesAgainst++
	case "abstain":
		proposal.VotesAbstain++
	}

	// Store updated proposal
	proposalJSON, err = json.Marshal(proposal)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(proposalID, proposalJSON)
}

// GetProposal retrieves a proposal by ID
func (g *GovernanceContract) GetProposal(ctx contractapi.TransactionContextInterface,
	proposalID string) (*Proposal, error) {

	proposalJSON, err := ctx.GetStub().GetState(proposalID)
	if err != nil {
		return nil, fmt.Errorf("failed to read proposal: %v", err)
	}
	if proposalJSON == nil {
		return nil, fmt.Errorf("proposal %s does not exist", proposalID)
	}

	var proposal Proposal
	err = json.Unmarshal(proposalJSON, &proposal)
	if err != nil {
		return nil, err
	}

	return &proposal, nil
}

// FinalizeProposal finalizes a proposal after voting period ends
func (g *GovernanceContract) FinalizeProposal(ctx contractapi.TransactionContextInterface,
	proposalID string) error {

	proposal, err := g.GetProposal(ctx, proposalID)
	if err != nil {
		return err
	}

	// Check if voting period has ended
	if time.Now().Before(proposal.VotingEnds) {
		return fmt.Errorf("voting period for proposal %s has not ended", proposalID)
	}

	// Check if already finalized
	if proposal.Status != "active" {
		return fmt.Errorf("proposal %s is already finalized", proposalID)
	}

	// Determine outcome
	totalVotes := proposal.VotesFor + proposal.VotesAgainst + proposal.VotesAbstain
	if totalVotes == 0 {
		proposal.Status = "failed"
	} else if proposal.VotesFor > proposal.VotesAgainst {
		proposal.Status = "passed"
	} else {
		proposal.Status = "failed"
	}

	// Store updated proposal
	proposalJSON, err := json.Marshal(proposal)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(proposalID, proposalJSON)
}

// GetAllProposals retrieves all proposals
func (g *GovernanceContract) GetAllProposals(ctx contractapi.TransactionContextInterface) ([]*Proposal, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var proposals []*Proposal
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var proposal Proposal
		err = json.Unmarshal(queryResponse.Value, &proposal)
		if err != nil {
			continue // Skip non-proposal records
		}

		// Only include actual proposals (check if it has the expected structure)
		if proposal.ID != "" {
			proposals = append(proposals, &proposal)
		}
	}

	return proposals, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&GovernanceContract{})
	if err != nil {
		fmt.Printf("Error creating governance chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting governance chaincode: %s", err.Error())
	}
}
