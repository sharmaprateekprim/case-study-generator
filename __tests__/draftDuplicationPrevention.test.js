describe('Draft Duplication Prevention', () => {
  test('should reuse existing draft ID when saving draft with same title', () => {
    // Mock existing drafts
    const existingDrafts = [
      { id: 'draft-123', title: 'My Case Study', createdAt: '2025-01-01' },
      { id: 'draft-456', title: 'Another Study', createdAt: '2025-01-02' }
    ];

    // Simulate the draft saving logic
    const saveDraft = (draftData, existingDrafts) => {
      let draftId = draftData.id;
      
      // If no ID provided, check for existing draft with same title
      if (!draftId && draftData.title) {
        const existingDraft = existingDrafts.find(draft => 
          draft.title === draftData.title
        );
        if (existingDraft) {
          draftId = existingDraft.id;
        }
      }
      
      // Generate new ID only if no existing draft found
      if (!draftId) {
        draftId = 'new-draft-' + Math.random().toString(36).substr(2, 9);
      }
      
      return {
        id: draftId,
        title: draftData.title || 'Untitled Draft',
        data: draftData,
        updatedAt: new Date().toISOString()
      };
    };

    // Test saving existing draft
    const existingDraftData = {
      title: 'My Case Study',
      challenge: 'Updated challenge'
    };

    const result = saveDraft(existingDraftData, existingDrafts);
    
    expect(result.id).toBe('draft-123'); // Should reuse existing ID
    expect(result.title).toBe('My Case Study');
    expect(result.data.challenge).toBe('Updated challenge');
  });

  test('should create new draft ID when title is unique', () => {
    const existingDrafts = [
      { id: 'draft-123', title: 'My Case Study', createdAt: '2025-01-01' }
    ];

    const saveDraft = (draftData, existingDrafts) => {
      let draftId = draftData.id;
      
      if (!draftId && draftData.title) {
        const existingDraft = existingDrafts.find(draft => 
          draft.title === draftData.title
        );
        if (existingDraft) {
          draftId = existingDraft.id;
        }
      }
      
      if (!draftId) {
        draftId = 'new-draft-' + Math.random().toString(36).substr(2, 9);
      }
      
      return {
        id: draftId,
        title: draftData.title || 'Untitled Draft',
        data: draftData
      };
    };

    // Test saving new draft
    const newDraftData = {
      title: 'Unique Case Study',
      challenge: 'New challenge'
    };

    const result = saveDraft(newDraftData, existingDrafts);
    
    expect(result.id).toMatch(/^new-draft-/); // Should create new ID
    expect(result.title).toBe('Unique Case Study');
  });

  test('should handle draft with explicit ID', () => {
    const existingDrafts = [
      { id: 'draft-123', title: 'My Case Study', createdAt: '2025-01-01' }
    ];

    const saveDraft = (draftData, existingDrafts) => {
      let draftId = draftData.id;
      
      if (!draftId && draftData.title) {
        const existingDraft = existingDrafts.find(draft => 
          draft.title === draftData.title
        );
        if (existingDraft) {
          draftId = existingDraft.id;
        }
      }
      
      if (!draftId) {
        draftId = 'new-draft-' + Math.random().toString(36).substr(2, 9);
      }
      
      return {
        id: draftId,
        title: draftData.title || 'Untitled Draft',
        data: draftData
      };
    };

    // Test saving draft with explicit ID
    const draftWithId = {
      id: 'explicit-draft-789',
      title: 'My Case Study', // Same title as existing
      challenge: 'Updated challenge'
    };

    const result = saveDraft(draftWithId, existingDrafts);
    
    expect(result.id).toBe('explicit-draft-789'); // Should use provided ID
    expect(result.title).toBe('My Case Study');
  });

  test('should handle empty or missing title', () => {
    const existingDrafts = [
      { id: 'draft-123', title: 'My Case Study', createdAt: '2025-01-01' }
    ];

    const saveDraft = (draftData, existingDrafts) => {
      let draftId = draftData.id;
      
      if (!draftId && draftData.title) {
        const existingDraft = existingDrafts.find(draft => 
          draft.title === draftData.title
        );
        if (existingDraft) {
          draftId = existingDraft.id;
        }
      }
      
      if (!draftId) {
        draftId = 'new-draft-' + Math.random().toString(36).substr(2, 9);
      }
      
      return {
        id: draftId,
        title: draftData.title || 'Untitled Draft',
        data: draftData
      };
    };

    // Test with empty title
    const emptyTitleDraft = {
      title: '',
      challenge: 'Some challenge'
    };

    const result1 = saveDraft(emptyTitleDraft, existingDrafts);
    expect(result1.id).toMatch(/^new-draft-/); // Should create new ID
    expect(result1.title).toBe('Untitled Draft');

    // Test with no title
    const noTitleDraft = {
      challenge: 'Some challenge'
    };

    const result2 = saveDraft(noTitleDraft, existingDrafts);
    expect(result2.id).toMatch(/^new-draft-/); // Should create new ID
    expect(result2.title).toBe('Untitled Draft');
  });

  test('should simulate multiple saves of same draft', () => {
    let existingDrafts = [];

    const saveDraft = (draftData, existingDrafts) => {
      let draftId = draftData.id;
      
      if (!draftId && draftData.title) {
        const existingDraft = existingDrafts.find(draft => 
          draft.title === draftData.title
        );
        if (existingDraft) {
          draftId = existingDraft.id;
        }
      }
      
      if (!draftId) {
        draftId = 'draft-' + Math.random().toString(36).substr(2, 9);
      }
      
      const draft = {
        id: draftId,
        title: draftData.title || 'Untitled Draft',
        data: draftData,
        updatedAt: new Date().toISOString()
      };

      // Update existing drafts array
      const existingIndex = existingDrafts.findIndex(d => d.id === draftId);
      if (existingIndex >= 0) {
        existingDrafts[existingIndex] = draft;
      } else {
        existingDrafts.push(draft);
      }

      return draft;
    };

    // First save
    const firstSave = saveDraft({ title: 'Test Draft', challenge: 'Challenge 1' }, existingDrafts);
    expect(existingDrafts).toHaveLength(1);
    expect(firstSave.data.challenge).toBe('Challenge 1');

    // Second save with same title
    const secondSave = saveDraft({ title: 'Test Draft', challenge: 'Challenge 2' }, existingDrafts);
    expect(existingDrafts).toHaveLength(1); // Should still be 1, not 2
    expect(secondSave.id).toBe(firstSave.id); // Same ID
    expect(secondSave.data.challenge).toBe('Challenge 2'); // Updated content

    // Third save with same title
    const thirdSave = saveDraft({ title: 'Test Draft', challenge: 'Challenge 3' }, existingDrafts);
    expect(existingDrafts).toHaveLength(1); // Should still be 1
    expect(thirdSave.id).toBe(firstSave.id); // Same ID
    expect(thirdSave.data.challenge).toBe('Challenge 3'); // Updated content
  });
});
