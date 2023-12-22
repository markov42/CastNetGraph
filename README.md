# Force-Directed Graph Visualization

## Features

### User Interface Elements:
- **Title**: Clearly displays the name of the visualization at the top.
- **Legend**: Includes blue and green circles along with a gray line, each with corresponding text labels explaining what they represent in the graph.
- **Search Input Field**: Allows users to search for specific TV Shows or Cast members. The implementation is flexible, and while the demonstration uses the HTML `<datalist>` element, alternatives and external libraries can be utilized.
- **Detail Info Card**: Shows detailed information for the entity that is either hovered over or searched for. This includes in-depth data about the selected TV Show or Cast member.

### Visualization:
- **Force-Directed Graph**: At the heart of this visualization is the force-directed graph algorithm, which arranges nodes and links in a two-dimensional space. This method ensures an equal length for links and minimizes crossing, providing a clear and understandable layout.

### User Interaction:
- **Hovering (mouseover)**: When a user hovers over a circle (representing a TV Show or Actor), it brings the node into focus along with its immediate neighbors. It also displays a text label showing the name and shows the Detail Info Card with more information.
- **Hovering out (mouseout)**: Retains the focus configuration until a different node is hovered over or the user clicks in the white-space area of the SVG.
- **Search Functionality**: Users can search for TV Shows or Actors. The search results are sorted alphabetically, and the graph mimics the hovering behavior upon selection.
- **Clicking on SVG White-space**: Clicking anywhere outside the nodes and links will hide the Detail Info Card and defocus any selected nodes.

## Technologies Used
- **D3.js**: Utilized for creating the dynamic and responsive force-directed graph.
- **HTML/CSS/JS**: Used for structuring and styling the user interface elements.

https://github.com/markov42/Force-Directed-Graph/assets/60806325/441c6e97-0547-4156-9a85-80d017ff90a1
