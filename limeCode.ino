// Project: eHacks 2017; Lime (affectionately called SmashBall 3000)
// Author(s): Jack Leshem, Matt Shepherd
// Description: Accelerometer implementation that can tell if the object is moving or sitting still.

// Variables
//  Debounce (false-positive filtering)
unsigned long prevDebounce = 0;
unsigned long debounce = 20;
bool setMovement = true;
bool prevMovement = false;

//  Movement Detection
float threshold = 1.10;

//  Pins
const int xPin = A2;
const int yPin = A1;
const int zPin = A0;

//  Data Smoothing
const int arraySize = 100;
float accelArray[arraySize]; 
int counter = 0;

//  Particle Sending
TCPClient client;
byte server[] = { 34, 203, 192, 18 }; // EC2 Instance IP
const int port = 7777;



void setup(void) {
//  Initialize Serial
    Serial.begin(9600);
    
//  Initialize data smoothing array
    
    for(int i = 0; i < arraySize; i++) readAccel();
}


void loop() {
// Get the current time
  unsigned long currentTime = millis();

// Record data from the accelerometer
  readAccel();

// Get accelerometer reading 
  float reading = moveCheck();
  bool currentMovement = (reading > threshold);

// If a change is detected, wait for debounce
  if (currentMovement != prevMovement) {
      prevDebounce = currentTime;
  }
  
// If there's a difference in state after debounce, change state
  if (currentTime - prevDebounce > debounce && currentMovement != setMovement) {
      setMovement = currentMovement;
      if (setMovement) {
            pingServer();
      }
  }

  prevMovement = currentMovement;
  
  delay(5);

// DEBUGGING
//  Send move/still over Serial stream
//   Serial.print(xAccel);
//   Serial.print(", ");
//   Serial.print(yAccel);
//   Serial.print(", ");
//   Serial.print(zAccel);
//   Serial.print(", ");
//   Serial.print(accelVector);
//   Serial.print("  :  ");
//
//  Send move/still over WiFi
//   if (accelVector < threshold) {
//      client.connect(server,7777);
//      client.println("GET /unicorn?move=0 HTTP/1.0");
//      client.println("Host: ec2-34-203-192-18.compute-1.amazon.aws.com");
//      client.println("Content-Length: 0");
//      client.println();
//      client.stop();
//   } else  {
//      client.connect(server,7777);
//      client.println("GET /unicorn?move=1 HTTP/1.0");
//      client.println("Host: ec2-34-203-192-18.compute-1.amazon.aws.com");
//      client.println("Content-Length: 0");
//      client.println();
//      client.stop();
//   }
//
//   delay(200);
    
}

void readAccel() {
//  Read in the analog acceleration values for each pin
    int xAccelRaw = analogRead(xPin);
    int yAccelRaw = analogRead(yPin);
    int zAccelRaw = analogRead(zPin);

//  Scale the readings to their absolute
    float xAccel = abs((float) (xAccelRaw - 2048) * 9.0 / 4095.0);
    float yAccel = abs((float) (yAccelRaw - 2048) * 9.0 / 4095.0);
    float zAccel = abs((float) (zAccelRaw - 2048) * 9.0 / 4095.0);
    
//  Calculate the magnitude of the vector
    float accelVector = sqrt(sq(xAccel) + sq(yAccel) + sq(zAccel));
    
//  Insert that magnitude into the array and change index
    int index = counter % arraySize;
    accelArray[index] = accelVector;
    counter++;
}

void pingServer() {
//  Connect to server, send ping, close connection
    client.connect(server,port);
    client.println("GET /unicorn?move=1 HTTP/1.0");
    client.println("Host: ec2-34-203-192-18.compute-1.amazon.aws.com");
    client.println("Content-Length: 0");
    client.println();
    client.stop();
}

float moveCheck() {
//  Return the average velocity magnitude over the past several measurements
    float sum = 0;
    for (int i = 0; i < arraySize; i++) {
        sum = sum + accelArray[i];
    }
    float avg = sum / (float) arraySize;
    return avg;
}
