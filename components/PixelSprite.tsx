import { StyleSheet, View } from 'react-native';

interface PixelSpriteProps {
  frame: string[];
  palette: Record<string, string>;
  pixelSize: number;
}

interface Segment {
  char: string;
  length: number;
}

function runLengthEncode(row: string): Segment[] {
  const segments: Segment[] = [];
  let current = row.charAt(0);
  let count = 1;
  for (let i = 1; i < row.length; i++) {
    const ch = row.charAt(i);
    if (ch === current) {
      count += 1;
    } else {
      segments.push({ char: current, length: count });
      current = ch;
      count = 1;
    }
  }
  segments.push({ char: current, length: count });
  return segments;
}

export function PixelSprite({ frame, palette, pixelSize }: PixelSpriteProps) {
  const width = frame.length > 0 ? frame[0].length : 0;
  const height = frame.length;

  return (
    <View style={{ width: width * pixelSize, height: height * pixelSize }}>
      {frame.map((row, y) => {
        let x = 0;
        return runLengthEncode(row).map((segment, i) => {
          const left = x;
          x += segment.length;
          const color = palette[segment.char];
          if (color === undefined) return null;
          return (
            <View
              key={`${y}-${i}`}
              style={[
                styles.block,
                {
                  left: left * pixelSize,
                  top: y * pixelSize,
                  width: segment.length * pixelSize,
                  height: pixelSize,
                  backgroundColor: color,
                },
              ]}
            />
          );
        });
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
  },
});
