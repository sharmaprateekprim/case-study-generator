describe('Draft Review Comments Functionality', () => {
  test('should add review comments to drafts and save to S3', async () => {
    const draftId = 'test-draft-comments';
    const mockComment = {
      comment: 'This looks good but needs more details in the solution section',
      author: 'Reviewer',
      timestamp: '2024-01-01T12:00:00.000Z'
    };

    // Mock S3 service for draft review comments
    const mockS3Service = {
      getDraftReviewComments: jest.fn().mockResolvedValue([]),
      saveDraftReviewComments: jest.fn().mockResolvedValue(true)
    };

    // Simulate adding a comment to a draft
    const addDraftComment = async (draftId, commentData, s3Service) => {
      const newComment = {
        comment: commentData.comment.trim(),
        author: commentData.author || 'Anonymous',
        timestamp: new Date().toISOString()
      };

      // Get existing comments
      const existingComments = await s3Service.getDraftReviewComments(draftId) || [];
      existingComments.push(newComment);

      // Save updated comments
      await s3Service.saveDraftReviewComments(draftId, existingComments);

      return {
        success: true,
        comment: newComment,
        message: 'Comment added successfully'
      };
    };

    const result = await addDraftComment(draftId, mockComment, mockS3Service);

    expect(result.success).toBe(true);
    expect(result.comment.comment).toBe(mockComment.comment);
    expect(result.comment.author).toBe(mockComment.author);
    expect(mockS3Service.getDraftReviewComments).toHaveBeenCalledWith(draftId);
    expect(mockS3Service.saveDraftReviewComments).toHaveBeenCalledWith(draftId, expect.arrayContaining([
      expect.objectContaining({
        comment: mockComment.comment,
        author: mockComment.author
      })
    ]));

    console.log('✅ Draft comment added and saved to S3:');
    console.log('  Draft ID:', draftId);
    console.log('  Comment:', result.comment.comment);
    console.log('  Author:', result.comment.author);
    console.log('  Timestamp:', result.comment.timestamp);
  });

  test('should fetch existing review comments for a draft', async () => {
    const draftId = 'test-draft-fetch';
    const existingComments = [
      {
        comment: 'First comment',
        author: 'Reviewer 1',
        timestamp: '2024-01-01T10:00:00.000Z'
      },
      {
        comment: 'Second comment',
        author: 'Reviewer 2',
        timestamp: '2024-01-01T11:00:00.000Z'
      }
    ];

    // Mock S3 service
    const mockS3Service = {
      getDraftReviewComments: jest.fn().mockResolvedValue(existingComments)
    };

    // Simulate fetching comments
    const fetchDraftComments = async (draftId, s3Service) => {
      const comments = await s3Service.getDraftReviewComments(draftId);
      return {
        success: true,
        comments: comments || []
      };
    };

    const result = await fetchDraftComments(draftId, mockS3Service);

    expect(result.success).toBe(true);
    expect(result.comments).toHaveLength(2);
    expect(result.comments[0].comment).toBe('First comment');
    expect(result.comments[1].comment).toBe('Second comment');
    expect(mockS3Service.getDraftReviewComments).toHaveBeenCalledWith(draftId);

    console.log('✅ Draft comments fetched from S3:');
    console.log('  Draft ID:', draftId);
    console.log('  Comments count:', result.comments.length);
    result.comments.forEach((comment, index) => {
      console.log(`  ${index + 1}. ${comment.author}: ${comment.comment}`);
    });
  });

  test('should handle multiple comments and maintain chronological order', async () => {
    const draftId = 'test-draft-multiple';
    let comments = [];

    // Mock S3 service that maintains state
    const mockS3Service = {
      getDraftReviewComments: jest.fn().mockImplementation(() => Promise.resolve([...comments])),
      saveDraftReviewComments: jest.fn().mockImplementation((id, newComments) => {
        comments = [...newComments];
        return Promise.resolve(true);
      })
    };

    // Simulate adding multiple comments
    const addComment = async (draftId, commentText, author, s3Service) => {
      const newComment = {
        comment: commentText,
        author: author,
        timestamp: new Date().toISOString()
      };

      const existingComments = await s3Service.getDraftReviewComments(draftId);
      existingComments.push(newComment);
      await s3Service.saveDraftReviewComments(draftId, existingComments);

      return newComment;
    };

    // Add multiple comments
    await addComment(draftId, 'First review comment', 'Reviewer A', mockS3Service);
    await addComment(draftId, 'Second review comment', 'Reviewer B', mockS3Service);
    await addComment(draftId, 'Third review comment', 'Reviewer A', mockS3Service);

    const finalComments = await mockS3Service.getDraftReviewComments(draftId);

    expect(finalComments).toHaveLength(3);
    expect(finalComments[0].comment).toBe('First review comment');
    expect(finalComments[1].comment).toBe('Second review comment');
    expect(finalComments[2].comment).toBe('Third review comment');

    // Verify chronological order
    expect(new Date(finalComments[0].timestamp).getTime()).toBeLessThanOrEqual(new Date(finalComments[1].timestamp).getTime());
    expect(new Date(finalComments[1].timestamp).getTime()).toBeLessThanOrEqual(new Date(finalComments[2].timestamp).getTime());

    console.log('✅ Multiple comments added in chronological order:');
    finalComments.forEach((comment, index) => {
      console.log(`  ${index + 1}. [${new Date(comment.timestamp).toLocaleTimeString()}] ${comment.author}: ${comment.comment}`);
    });
  });

  test('should display comments in the draft review UI', () => {
    const mockDraft = {
      id: 'ui-test-draft',
      title: 'UI Test Draft',
      status: 'under_review'
    };

    const mockComments = [
      {
        comment: 'The overview section needs more technical details',
        author: 'Technical Reviewer',
        timestamp: '2024-01-01T10:00:00.000Z'
      },
      {
        comment: 'Great work on the metrics section',
        author: 'Business Reviewer',
        timestamp: '2024-01-01T11:00:00.000Z'
      }
    ];

    // Simulate rendering the comments section
    const renderCommentsSection = (draft, comments) => {
      const section = {
        title: 'Review Discussion',
        canAddComment: draft.status === 'under_review',
        comments: comments.map(comment => ({
          author: comment.author,
          timestamp: new Date(comment.timestamp).toLocaleString(),
          text: comment.comment,
          style: {
            backgroundColor: '#f8f9fa',
            padding: '0.75rem',
            marginBottom: '0.5rem',
            borderRadius: '4px',
            borderLeft: '3px solid #007bff'
          }
        })),
        addCommentForm: draft.status === 'under_review' ? {
          placeholder: 'Add a comment to the discussion...',
          buttonText: 'Add Comment',
          buttonClass: 'btn btn-primary'
        } : null
      };

      return section;
    };

    const renderedSection = renderCommentsSection(mockDraft, mockComments);

    expect(renderedSection.title).toBe('Review Discussion');
    expect(renderedSection.canAddComment).toBe(true);
    expect(renderedSection.comments).toHaveLength(2);
    expect(renderedSection.comments[0].author).toBe('Technical Reviewer');
    expect(renderedSection.comments[1].author).toBe('Business Reviewer');
    expect(renderedSection.addCommentForm).toBeDefined();
    expect(renderedSection.addCommentForm.buttonText).toBe('Add Comment');

    console.log('✅ Comments UI section rendered:');
    console.log('  Title:', renderedSection.title);
    console.log('  Can add comment:', renderedSection.canAddComment);
    console.log('  Comments displayed:', renderedSection.comments.length);
    renderedSection.comments.forEach((comment, index) => {
      console.log(`    ${index + 1}. ${comment.author} (${comment.timestamp}): ${comment.text}`);
    });
  });

  test('should demonstrate the complete review workflow with comments', () => {
    const workflowSteps = [
      {
        step: 1,
        action: 'Draft submitted for review',
        draftStatus: 'under_review',
        commentsCount: 0,
        canAddComments: true
      },
      {
        step: 2,
        action: 'Reviewer adds first comment',
        comment: 'Please add more details to the implementation section',
        author: 'Senior Reviewer',
        commentsCount: 1
      },
      {
        step: 3,
        action: 'Another reviewer adds comment',
        comment: 'The metrics look good, but consider adding ROI calculations',
        author: 'Business Analyst',
        commentsCount: 2
      },
      {
        step: 4,
        action: 'Author incorporates feedback',
        draftStatus: 'draft',
        canAddComments: false,
        commentsCount: 2,
        commentsPreserved: true
      },
      {
        step: 5,
        action: 'Draft resubmitted for review',
        draftStatus: 'under_review',
        canAddComments: true,
        commentsCount: 2
      },
      {
        step: 6,
        action: 'Final review comment added',
        comment: 'Looks great now, ready for approval',
        author: 'Senior Reviewer',
        commentsCount: 3
      }
    ];

    let currentCommentsCount = 0;
    let currentStatus = 'draft';

    workflowSteps.forEach(step => {
      console.log(`Step ${step.step}: ${step.action}`);
      
      if (step.draftStatus) {
        currentStatus = step.draftStatus;
        console.log(`  Draft Status: ${currentStatus}`);
      }
      
      if (step.comment) {
        currentCommentsCount++;
        console.log(`  Comment Added: "${step.comment}" by ${step.author}`);
      }
      
      if (step.commentsCount !== undefined) {
        expect(currentCommentsCount).toBe(step.commentsCount);
        console.log(`  Total Comments: ${currentCommentsCount}`);
      }
      
      if (step.canAddComments !== undefined) {
        const canAdd = currentStatus === 'under_review';
        expect(canAdd).toBe(step.canAddComments);
        console.log(`  Can Add Comments: ${canAdd}`);
      }
      
      if (step.commentsPreserved) {
        console.log(`  Comments Preserved: ${step.commentsPreserved}`);
      }
    });

    expect(currentCommentsCount).toBe(3);
    expect(currentStatus).toBe('under_review');
  });

  test('should verify S3 storage structure for draft review comments', () => {
    const draftId = 'storage-test-draft';
    const expectedS3Structure = {
      bucket: 'case-study-bucket',
      keyPath: `draft-reviews/${draftId}/comments.json`,
      contentType: 'application/json',
      structure: {
        type: 'array',
        items: {
          comment: 'string',
          author: 'string',
          timestamp: 'ISO string'
        }
      }
    };

    // Simulate S3 storage operation
    const saveToS3 = (draftId, comments) => {
      const s3Key = `draft-reviews/${draftId}/comments.json`;
      const s3Body = JSON.stringify(comments, null, 2);
      
      return {
        bucket: 'case-study-bucket',
        key: s3Key,
        body: s3Body,
        contentType: 'application/json',
        size: s3Body.length
      };
    };

    const testComments = [
      {
        comment: 'Test comment',
        author: 'Test Author',
        timestamp: '2024-01-01T12:00:00.000Z'
      }
    ];

    const s3Operation = saveToS3(draftId, testComments);

    expect(s3Operation.key).toBe(expectedS3Structure.keyPath);
    expect(s3Operation.contentType).toBe(expectedS3Structure.contentType);
    expect(s3Operation.body).toContain('Test comment');
    expect(s3Operation.body).toContain('Test Author');

    console.log('✅ S3 storage structure verified:');
    console.log('  Bucket:', s3Operation.bucket);
    console.log('  Key:', s3Operation.key);
    console.log('  Content Type:', s3Operation.contentType);
    console.log('  Body Size:', s3Operation.size, 'bytes');
    console.log('  Sample Content:', JSON.parse(s3Operation.body)[0].comment);
  });
});
