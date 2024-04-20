import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Assuming useNavigate is used for routing
import {
  StyledGame,
  StyledScore,
  StyledTimer,
  GridContainer,
  StyledCard,
  StyledQuestion,
  StyledAnswer,
} from "../styled/Game";
import { StrongText } from "../styled/StrongText";
import { useScore } from "../context/ScoreContext";

const defaultTime = 500;
const defaultHeart = 300;
const numCards = 9; // Number of cards you want to display

const generateCard = () => {
  const num1 = Math.floor(Math.random() * 10000) + 10;
  const num2 = Math.floor(Math.random() * 10000) + 10;
  return {
    id: Math.random(),
    question: `${num1} + ${num2}`,
    answer: `${num1 + num2}`,
    time: defaultTime,
    typed: "",
  };
};

export default function Game() {
  const [cards, setCards] = useState(
    Array.from({ length: numCards }, generateCard)
  );
  const [hearts, setHearts] = useState();
  const [score, setScore] = useScore();
  const [typedCardIds, setTypedCardIds] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    setScore(0);
    setHearts(defaultHeart);
  }, [setScore]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key >= "0" && event.key <= "9") {
        let newInput = event.key;
        let matches = [];
        let correctInput = false;
        let completedCard = false; // Flag to indicate card completion

        const newCards = cards.map((card) => {
          // Determine the new potential typed string
          const updatedTyped = card.typed + newInput;

          // Check if the card is currently being typed and if it matches the new input
          if (
            (typedCardIds.length === 0 || typedCardIds.includes(card.id)) &&
            card.answer.startsWith(updatedTyped)
          ) {
            correctInput = true; // At least one card matches
            if (updatedTyped === card.answer) {
              completedCard = true; // This card is completely answered
              setScore((score) => score + 1); // Increment score
              return generateCard(); // Replace the completed card with a new one
            }
            matches.push(card.id); // This card continues to match
            return { ...card, typed: updatedTyped };
          } else {
            // Reset typed if this card was previously being typed but no longer matches
            if (typedCardIds.includes(card.id)) {
              return { ...card, typed: "" };
            }
          }
          // Return card as is if it was not being typed or didn't need to be reset
          return card;
        });

        if (completedCard) {
          // If a card is completed, reset all typings and clear matches
          const resetCards = newCards.map((card) => ({ ...card, typed: "" }));
          setCards(resetCards);
          matches = []; // Clear matches as we reset all cards
        } else if (!correctInput) {
          matches = [];
          // Reduce hearts only if no correct input
          setHearts((hearts) => Math.max(0, hearts - 1));
          // Reset the typing on all cards
          const resetCards = newCards.map((card) => ({ ...card, typed: "" }));
          // Check for any potential matches with new input among reset cards
          const finalCards = resetCards.map((card) => {
            if (card.typed === "" && card.answer.startsWith(newInput)) {
              matches.push(card.id); // Add to matches if it's now a valid start
              return { ...card, typed: newInput };
            }
            return card;
          });
          setCards(finalCards);
        } else {
          setCards(newCards); // Update cards state with correct input
        }

        setTypedCardIds(matches); // Update which cards are being typed
      }
    },
    [cards, typedCardIds, setScore, setHearts] // Ensure dependencies are correctly listed
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]); // handleKeyDown is now stable across renders

  useEffect(() => {
    if (hearts <= 0) {
      navigate("/gameOver");
    }
  }, [hearts, navigate]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCards((prevCards) =>
        prevCards.map((card) => {
          if (card.time > 1) {
            return { ...card, time: card.time - 1 };
          } else {
            setHearts((hearts) => Math.max(0, hearts - 1));
            return generateCard(); // Generate a new card when time expires
          }
        })
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <StyledGame>
      <StyledScore>
        Score: <StrongText>{score}</StrongText>
      </StyledScore>
      <GridContainer>
        {cards.map((card, i) => (
          <StyledCard key={card.id}>
            <StyledQuestion>{card.question}</StyledQuestion>
            <StyledAnswer>{card.typed}</StyledAnswer>
          </StyledCard>
        ))}
      </GridContainer>
      <div>Hearts: {hearts}</div>
    </StyledGame>
  );
}
