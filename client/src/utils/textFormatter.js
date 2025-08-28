// Utility function to format text with numbered lists and preserve formatting
export const formatTextWithLists = (text) => {
  if (!text) return '';
  
  // Split text into lines
  const lines = text.split('\n');
  const formattedLines = [];
  let inList = false;
  let listItems = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line starts with a number followed by a period or parenthesis
    const numberedListMatch = line.match(/^(\d+)[\.\)]\s*(.+)$/);
    
    if (numberedListMatch) {
      // This is a numbered list item
      if (!inList) {
        // Starting a new list
        inList = true;
        listItems = [];
      }
      listItems.push({
        number: numberedListMatch[1],
        content: numberedListMatch[2]
      });
    } else {
      // Not a numbered list item
      if (inList) {
        // End the current list and add it to formatted lines
        formattedLines.push({
          type: 'list',
          items: [...listItems]
        });
        inList = false;
        listItems = [];
      }
      
      // Add regular line if it's not empty
      if (line) {
        formattedLines.push({
          type: 'text',
          content: line
        });
      } else {
        // Add empty line for spacing
        formattedLines.push({
          type: 'break'
        });
      }
    }
  }
  
  // Handle case where text ends with a list
  if (inList && listItems.length > 0) {
    formattedLines.push({
      type: 'list',
      items: listItems
    });
  }
  
  return formattedLines;
};

// React component to render formatted text
export const FormattedText = ({ text, maxLength = null }) => {
  if (!text) return null;
  
  // If maxLength is specified, truncate the text first
  const displayText = maxLength && text.length > maxLength 
    ? text.substring(0, maxLength) + '...'
    : text;
  
  const formattedContent = formatTextWithLists(displayText);
  
  return (
    <div className="formatted-text">
      {formattedContent.map((item, index) => {
        switch (item.type) {
          case 'list':
            return (
              <ol key={index} className="formatted-list">
                {item.items.map((listItem, itemIndex) => (
                  <li key={itemIndex} className="formatted-list-item">
                    {listItem.content}
                  </li>
                ))}
              </ol>
            );
          case 'text':
            return (
              <p key={index} className="formatted-paragraph">
                {item.content}
              </p>
            );
          case 'break':
            return <br key={index} />;
          default:
            return null;
        }
      })}
    </div>
  );
};

// Alternative function for simple inline formatting (for shorter previews)
export const formatTextInline = (text, maxLength = 200) => {
  if (!text) return '';
  
  // For inline display, convert numbered lists to a more compact format
  const lines = text.split('\n');
  const processedLines = lines.map(line => {
    const numberedListMatch = line.trim().match(/^(\d+)[\.\)]\s*(.+)$/);
    if (numberedListMatch) {
      return `${numberedListMatch[1]}. ${numberedListMatch[2]}`;
    }
    return line.trim();
  }).filter(line => line); // Remove empty lines
  
  const result = processedLines.join(' • ');
  
  return maxLength && result.length > maxLength 
    ? result.substring(0, maxLength) + '...'
    : result;
};
