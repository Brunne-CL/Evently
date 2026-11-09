import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'evently_mark.dart';

export 'evently_mark.dart';

/// Contenedor para pantallas Wear OS redondas.
class WatchShell extends StatelessWidget {
  const WatchShell({
    super.key,
    required this.child,
    this.insetFactor = 0.14,
  });

  final Widget child;
  final double insetFactor;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kEventlyPaper,
      body: LayoutBuilder(
        builder: (context, constraints) {
          final side = math.min(constraints.maxWidth, constraints.maxHeight);
          final inset = side * insetFactor;

          return Center(
            child: SizedBox(
              width: side,
              height: side,
              child: ClipOval(
                child: ColoredBox(
                  color: kEventlyPaper,
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(
                      inset * 1.05,
                      inset * 0.85,
                      inset * 1.05,
                      inset * 0.95,
                    ),
                    child: MediaQuery.removePadding(
                      context: context,
                      removeTop: true,
                      removeBottom: true,
                      removeLeft: true,
                      removeRight: true,
                      child: child,
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Campo compacto tipo píldora para reloj redondo.
class WatchField extends StatelessWidget {
  const WatchField({
    super.key,
    required this.controller,
    required this.hint,
    this.keyboardType,
    this.obscure = false,
    this.inputFormatters,
  });

  final TextEditingController controller;
  final String hint;
  final TextInputType? keyboardType;
  final bool obscure;
  final List<TextInputFormatter>? inputFormatters;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 34,
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscure,
        inputFormatters: inputFormatters,
        style: const TextStyle(color: kEventlyInk, fontSize: 12, height: 1.1),
        cursorColor: kEventlyGreen,
        textAlignVertical: TextAlignVertical.center,
        decoration: InputDecoration(
          isDense: true,
          hintText: hint,
          hintStyle: const TextStyle(color: kEventlyMuted, fontSize: 11),
          filled: true,
          fillColor: kEventlyCard,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 0),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: kEventlyLine),
          ),
        ),
      ),
    );
  }
}
