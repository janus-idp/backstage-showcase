function ensureSvgIsWhite(svgString: string) {
  // Replace all fill attributes except those with "none" or "transparent"
  let updatedSvg = svgString.replace(
    /fill="(?!none|transparent)[^"]*"/g,
    'fill="#fff"',
  );

  // Replace all stroke attributes except those with "none" or "transparent"
  updatedSvg = updatedSvg.replace(
    /stroke="(?!none|transparent)[^"]*"/g,
    'stroke="#fff"',
  );

  // Ensure all fillable elements have fill="#fff" unless they are "none" or "transparent"
  const fillableElements = [
    'path',
    'circle',
    'rect',
    'polygon',
    'ellipse',
    'line',
    'polyline',
    'g',
    'text',
  ];

  fillableElements.forEach(element => {
    const regex = new RegExp(`<${element}(\\s+)(?!(?:[^>]*\\s)?fill=)`, 'g');
    updatedSvg = updatedSvg.replace(regex, `<${element}$1fill="#fff" `);
  });

  return updatedSvg;
}

export default ensureSvgIsWhite;
